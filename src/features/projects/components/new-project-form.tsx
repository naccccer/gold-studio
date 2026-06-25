"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Add,
  ArrowDown2,
  ArrowLeft,
  Camera,
  CloseCircle,
  DocumentUpload,
  Gallery,
  Image as ImageIcon,
  Magicpen,
  TickCircle,
} from "vuesax-icons-react";
import { ActionDock } from "@/components/ui/action-dock";
import { AppTopBar } from "@/components/ui/app-top-bar";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  createPendingGalleryUpload,
  startPendingGalleryUpload,
  type PendingUploadSource,
} from "@/features/gallery/client-upload-store";
import { GalleryCropScreen } from "@/features/gallery/screens/gallery-crop-screen";
import type { ProjectFormState } from "@/features/projects/actions";
import {
  StyleChoiceControl,
  StyleRangeControl,
  StyleSegmentedChoiceControl,
  StyleToggleControl,
} from "@/features/projects/components/style-choice-control";
import type { StyleControlOption, StyleOption } from "@/features/projects/presets";
import { isSampleReferenceStyleId } from "@/lib/ai/style-policy";
import { NO_CREDITS_ERROR } from "@/lib/credits";
import { getDefaultProductType, getProductTypes, normalizeProductType, productTypeLabel } from "@/lib/product-types";
import type { VerticalContent } from "@/lib/vertical-content";
import type { VerticalId } from "@/lib/verticals";

const INITIAL_STATE: ProjectFormState = {};

export type GalleryAssetOption = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
  visionShortTitle?: string | null;
  productType: string | null;
};

export type StyleReferenceOption = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
};

export type ReadyStyleReferenceOption = {
  id: string;
  fileUrl: string;
  title: string;
  alt: string;
};

type NewProjectFormProps = {
  action: (
    prevState: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  galleryAssets: GalleryAssetOption[];
  readyStyleReferences: ReadyStyleReferenceOption[];
  styleReferences: StyleReferenceOption[];
  selectedAssetId?: string;
  selectedReferenceId?: string;
  freeVariantParentId?: string;
  styles: StyleOption[];
  vertical: VerticalId;
  content: VerticalContent;
  defaultOutputPreset?: OutputPresetId;
  initialStep?: WizardStep;
  initialStyleId?: string;
};

type OutputPresetId = "post" | "story" | "banner";
type WizardStep = "source" | "size" | "style";
type StyleControl = NonNullable<StyleOption["controls"]>[number];
type CropUploadPurpose = "source" | "supporting";
const MAX_SUPPORTING_PRODUCT_IMAGES = 2;

function StepScrollPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-0 flex-1 overflow-hidden">
      <div className="scrollbar-none -ml-6 flex h-full min-h-0 w-[calc(100%+1.5rem)] flex-col gap-5 overflow-y-auto pl-6 pt-3">
        {children}
      </div>
    </section>
  );
}

const outputPresets: Array<{
  id: OutputPresetId;
  label: string;
  ratio: string;
}> = [
  {
    id: "post",
    label: "پست",
    ratio: "۱:۱",
  },
  {
    id: "story",
    label: "استوری",
    ratio: "۹:۱۶",
  },
  {
    id: "banner",
    label: "بنر",
    ratio: "۱۶:۹",
  },
];

function SourceActionButton({
  children,
  htmlFor,
  href,
  featured = false,
  guideTarget,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  href?: string;
  featured?: boolean;
  guideTarget?: string;
}) {
  const className =
    featured
      ? "h-12 w-full rounded-[1rem] border border-white bg-white text-xs font-semibold !text-[#171411] shadow-[0_18px_30px_-24px_rgba(255,255,255,0.82)] hover:bg-[#fff8ef]"
      : "h-12 w-full rounded-[1rem] border border-white/14 bg-white/[0.06] text-xs font-semibold !text-surface shadow-none hover:border-white/24 hover:bg-white/[0.1]";

  if (href) {
    return (
      <ButtonLink href={href} variant="studio-secondary" className={className} data-start-guide-target={guideTarget}>
        {children}
      </ButtonLink>
    );
  }

  return (
    <label htmlFor={htmlFor} data-start-guide-target={guideTarget} className={buttonClasses({ variant: featured ? "light" : "studio-secondary", className })}>
      {children}
    </label>
  );
}

function parseChoiceOptions(optionsJson?: string | null): StyleControlOption[] {
  if (!optionsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getControlDefaultValue(control: StyleControl) {
  if (control.defaultValue !== null && control.defaultValue !== undefined) {
    return control.defaultValue;
  }

  if (control.type === "BOOLEAN") return "false";
  if (control.type === "RANGE") return String(control.minValue ?? 0);

  return parseChoiceOptions(control.optionsJson)[0]?.value ?? "";
}

function getInitialStyleControlValues(style?: StyleOption) {
  return Object.fromEntries((style?.controls ?? []).map((control) => [control.key, getControlDefaultValue(control)]));
}

function shouldShowStyleControl(control: StyleControl, values: Record<string, string>) {
  return control.key !== "fullHijab" || (values.modelGender ?? "woman") === "woman";
}

function getResolvedStyleControlValue(control: StyleControl, values: Record<string, string>) {
  if (control.key === "fullHijab" && !shouldShowStyleControl(control, values)) {
    return "false";
  }

  return values[control.key] ?? getControlDefaultValue(control);
}

export function NewProjectForm({
  action,
  galleryAssets,
  readyStyleReferences,
  styleReferences,
  selectedAssetId,
  selectedReferenceId,
  freeVariantParentId,
  styles,
  vertical,
  content,
  defaultOutputPreset = "post",
  initialStep,
  initialStyleId,
}: NewProjectFormProps) {
  const router = useRouter();
  const explicitSelectedAsset = selectedAssetId
    ? galleryAssets.find((asset) => asset.id === selectedAssetId) ?? null
    : null;
  const defaultStyle = styles.find((style) => style.id === initialStyleId) ?? styles[0];
  const explicitSelectedReference = selectedReferenceId
    ? styleReferences.find((reference) => reference.id === selectedReferenceId) ?? null
    : null;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [step, setStep] = useState<WizardStep>(() => {
    if (initialStep === "size" && explicitSelectedAsset) {
      return "size";
    }

    if (initialStep === "style" && explicitSelectedAsset) {
      return "style";
    }

    return explicitSelectedAsset && !freeVariantParentId ? "size" : "source";
  });
  const [selectedAsset, setSelectedAsset] = useState<GalleryAssetOption | null>(explicitSelectedAsset);
  const [supportingAssets, setSupportingAssets] = useState<GalleryAssetOption[]>([]);
  const [supportingPanelOpen, setSupportingPanelOpen] = useState(false);
  const [cropUploadId, setCropUploadId] = useState<string | null>(null);
  const [cropUploadPurpose, setCropUploadPurpose] = useState<CropUploadPurpose>("source");
  const [outputPreset, setOutputPreset] = useState<OutputPresetId>(defaultOutputPreset);
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle?.id ?? "");
  const [selectedReference, setSelectedReference] = useState<StyleReferenceOption | null>(explicitSelectedReference);
  const [selectedReadySampleId, setSelectedReadySampleId] = useState<string | null>(null);
  const [referenceUploadPreview, setReferenceUploadPreview] = useState<string | null>(null);
  const [styleControlValues, setStyleControlValues] = useState<Record<string, string>>(() => getInitialStyleControlValues(defaultStyle));
  const [openStyleControl, setOpenStyleControl] = useState<string | null>(null);
  const [productType, setProductType] = useState(normalizeProductType(explicitSelectedAsset?.productType, vertical));
  const [sourcePreparing, setSourcePreparing] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const fileInputRequestRef = useRef(0);
  const productTypes = getProductTypes(vertical);
  const defaultProductType = getDefaultProductType(vertical);
  const uploadPreview = content.placeholders.uploadPreview;
  const topBarTitles: Record<WizardStep, string> = {
    source: content.newProjectSourceTitle,
    size: content.newProjectSizeTitle,
    style: content.newProjectStyleTitle,
  };

  const selectedStyleData = useMemo(
    () => styles.find((preset) => preset.id === selectedStyle) ?? defaultStyle,
    [defaultStyle, selectedStyle, styles],
  );

  const styleControls = selectedStyleData?.controls ?? [];
  const isSampleReferenceStyle = isSampleReferenceStyleId(selectedStyleData?.id);
  const outputPresetItems = outputPresets.map((preset) => ({
    value: preset.id,
    label: preset.label,
    badge: (
      <span className="text-[10px] font-medium text-muted" dir="ltr">
        {preset.ratio}
      </span>
    ),
  }));
  const visibleGalleryAssets = galleryAssets.slice(0, 4);
  const currentImageSrc = selectedAsset?.fileUrl ?? null;
  const hasSource = Boolean(currentImageSrc);
  const hasSupportingAssets = supportingAssets.length > 0;
  const shouldShowSupportingPanel = supportingPanelOpen || hasSupportingAssets;
  const shouldOfferSupportingOnSizeStep = Boolean(explicitSelectedAsset);
  const canContinue = hasSource && !sourcePreparing && !sourceError;
  const canSubmit = Boolean(selectedStyleData) && canContinue;
  const canSubmitWithReference = canSubmit && (!isSampleReferenceStyle || Boolean(selectedReference || selectedReadySampleId || referenceUploadPreview));
  const canAddSupportingAsset = hasSource && supportingAssets.length < MAX_SUPPORTING_PRODUCT_IMAGES && !sourcePreparing;
  const shouldShowBillingShortcut = state.error === NO_CREDITS_ERROR;

  useEffect(() => {
    return () => {
      if (referenceUploadPreview) {
        URL.revokeObjectURL(referenceUploadPreview);
      }
    };
  }, [referenceUploadPreview]);

  function beginGalleryUploadCrop(file: File, source: PendingUploadSource, purpose: CropUploadPurpose) {
    fileInputRequestRef.current += 1;
    setSourcePreparing(true);
    setSourceError(null);
    setCropUploadPurpose(purpose);

    if (purpose === "source") {
      setSelectedAsset(null);
      setSupportingAssets([]);
      setSupportingPanelOpen(false);
      setProductType(defaultProductType);
    }

    const pendingUpload = createPendingGalleryUpload(file, source);
    setCropUploadId(pendingUpload.id);
    void startPendingGalleryUpload(pendingUpload.id).catch((error) => {
      setSourceError(error instanceof Error ? error.message : "آپلود تصویر کامل نشد. دوباره تلاش کنید.");
      setSourcePreparing(false);
    });
  }

  function handleImageInputChange(event: React.ChangeEvent<HTMLInputElement>, otherInputId: string) {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    setSourceError(null);

    const otherInput = document.getElementById(otherInputId);
    if (otherInput instanceof HTMLInputElement) {
      otherInput.value = "";
    }

    if (!file) {
      setSourcePreparing(false);
      return;
    }

    input.value = "";
    beginGalleryUploadCrop(file, input.id === "project-camera-input" ? "camera" : "files", "source");
  }

  function handleSupportingImageInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    setSourceError(null);

    if (!file) {
      setSourcePreparing(false);
      return;
    }

    input.value = "";
    if (!canAddSupportingAsset) {
      return;
    }

    beginGalleryUploadCrop(file, "files", "supporting");
  }

  function selectAsset(asset: GalleryAssetOption) {
    fileInputRequestRef.current += 1;
    setSourcePreparing(false);
    setSourceError(null);
    setSelectedAsset(asset);
    setSupportingAssets((current) => current.filter((item) => item.id !== asset.id));
    setSupportingPanelOpen(false);
    setProductType(normalizeProductType(asset.productType, vertical));
  }

  function clearSource() {
    fileInputRequestRef.current += 1;
    setSourcePreparing(false);
    setSourceError(null);
    const cameraInput = document.getElementById("project-camera-input");
    const fileInput = document.getElementById("project-file-input");
    if (cameraInput instanceof HTMLInputElement) {
      cameraInput.value = "";
    }
    if (fileInput instanceof HTMLInputElement) {
      fileInput.value = "";
    }
    setSelectedAsset(null);
    setSupportingAssets([]);
    setSupportingPanelOpen(false);
    setCropUploadId(null);
  }

  function addSupportingAsset(asset: GalleryAssetOption) {
    if (selectedAsset?.id === asset.id) {
      return;
    }

    setSupportingAssets((current) => {
      if (current.some((item) => item.id === asset.id) || current.length >= MAX_SUPPORTING_PRODUCT_IMAGES) {
        return current;
      }

      setSupportingPanelOpen(true);
      return [...current, asset];
    });
  }

  function removeSupportingAsset(assetId: string) {
    setSupportingAssets((current) => current.filter((asset) => asset.id !== assetId));
  }

  function selectStyle(style: StyleOption) {
    setSelectedStyle(style.id);
    setStyleControlValues(getInitialStyleControlValues(style));
    setOpenStyleControl(null);
  }

  function selectReference(reference: StyleReferenceOption) {
    const input = document.getElementById("project-reference-file-input");
    if (input instanceof HTMLInputElement) {
      input.value = "";
    }
    setReferenceUploadPreview(null);
    setSelectedReadySampleId(null);
    setSelectedReference(reference);
  }

  function selectReadyReference(reference: ReadyStyleReferenceOption) {
    const input = document.getElementById("project-reference-file-input");
    if (input instanceof HTMLInputElement) {
      input.value = "";
    }
    setReferenceUploadPreview(null);
    setSelectedReference(null);
    setSelectedReadySampleId(reference.id);
  }

  function setStyleControlValue(key: string, value: string) {
    setStyleControlValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "modelGender" && value !== "woman" ? { fullHijab: "false" } : {}),
    }));
    if (key === "modelGender") {
      setOpenStyleControl(null);
    }
  }

  function handleTopBarBack() {
    if (step === "style") {
      router.push("/gallery");
      return;
    }

    if (step === "size") {
      setStep("source");
      return;
    }

    router.push("/gallery");
  }

  function handleCropClose(options?: {
    refresh?: boolean;
    selectedAssetId?: string;
    selectedAssetFileUrl?: string;
    selectedAssetTitle?: string | null;
    selectedAssetOriginalName?: string | null;
  }) {
    setCropUploadId(null);
    setSourcePreparing(false);

    if (options?.selectedAssetId && options.selectedAssetFileUrl) {
      const uploadedAsset: GalleryAssetOption = {
        id: options.selectedAssetId,
        fileUrl: options.selectedAssetFileUrl,
        title: options.selectedAssetTitle ?? null,
        originalName: options.selectedAssetOriginalName ?? null,
        productType,
      };

      if (cropUploadPurpose === "supporting") {
        addSupportingAsset(uploadedAsset);
      } else {
        selectAsset(uploadedAsset);
        setStep("size");
      }
    }

    if (options?.refresh) {
      router.refresh();
    }
  }

  return (
    <>
    <form action={formAction} className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <AppTopBar
        title={topBarTitles[step]}
        onBack={handleTopBarBack}
        logoVariant="mark-light"
        tone="dark"
        className="mb-0 min-h-12 px-0"
      />
      <input type="hidden" name="generationMode" value="image" />
      <input type="hidden" name="outputPreset" value={outputPreset} />
      {styleControls.map((control) => (
        <input key={control.key} type="hidden" name={`styleControl_${control.key}`} value={getResolvedStyleControlValue(control, styleControlValues)} />
      ))}
      {freeVariantParentId ? <input type="hidden" name="freeVariantParentId" value={freeVariantParentId} /> : null}
      {selectedAsset ? <input type="hidden" name="sourceAssetId" value={selectedAsset.id} /> : null}
      {supportingAssets.map((asset) => (
        <input key={asset.id} type="hidden" name="supportingAssetId" value={asset.id} />
      ))}
      {selectedReference ? <input type="hidden" name="referenceAssetId" value={selectedReference.id} /> : null}
      {selectedReadySampleId ? <input type="hidden" name="readySampleId" value={selectedReadySampleId} /> : null}
      <input type="hidden" name="productType" value={productType} />

      <input
        id="project-camera-input"
        name="image"
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => void handleImageInputChange(event, "project-file-input")}
      />
      <input
        id="project-file-input"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleImageInputChange(event, "project-camera-input")}
      />
      <input
        id="project-reference-file-input"
        name="referenceImage"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0] ?? null;
          setSelectedReference(null);
          setSelectedReadySampleId(null);
          setReferenceUploadPreview((current) => {
            if (current) {
              URL.revokeObjectURL(current);
            }

            return file ? URL.createObjectURL(file) : null;
          });
        }}
      />
      <input
        id="project-supporting-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleSupportingImageInputChange}
      />

      {step === "source" ? (
        <StepScrollPanel>
          <div className="grid grid-cols-3 gap-3">
            <SourceActionButton htmlFor="project-file-input" featured guideTarget="project-upload">
              <DocumentUpload aria-hidden={true} className="h-4 w-4" />
              <span>آپلود</span>
            </SourceActionButton>
            <SourceActionButton htmlFor="project-camera-input">
              <Camera aria-hidden={true} className="h-4 w-4" />
              <span>دوربین</span>
            </SourceActionButton>
            <SourceActionButton href="/gallery">
              <Gallery aria-hidden={true} className="h-4 w-4" />
              <span>گالری</span>
            </SourceActionButton>
          </div>

          {sourcePreparing ? (
            <p className="rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-2 text-xs leading-6 text-surface/72">
              {content.sourcePreparingLabel}
            </p>
          ) : null}

          {sourceError ? (
            <div className="rounded-[1rem] border border-danger/24 bg-danger-soft/92 px-3 py-3 text-danger shadow-[0_18px_32px_-26px_rgba(152,59,52,0.42)]">
              <p className="text-sm font-semibold">{content.sourceErrorTitle}</p>
              <p className="mt-1 text-[12px] leading-6 text-danger/88">{sourceError}</p>
            </div>
          ) : null}

          {visibleGalleryAssets.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-surface/72">{content.sourceReadyLabel}</p>
                {galleryAssets.length > visibleGalleryAssets.length ? (
                  <ButtonLink href="/gallery" variant="ghost" className="min-h-8 px-0 text-xs !text-surface/72 hover:!text-surface">
                    دیدن همه
                  </ButtonLink>
                ) : null}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {visibleGalleryAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const title = asset.title || asset.visionShortTitle || asset.originalName || content.galleryImageFallbackTitle;

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => selectAsset(asset)}
                      aria-label={`انتخاب ${title}`}
                      className="text-right"
                    >
                      <JewelryImageFrame aspect="square" selected={isSelected} treatment="quiet" className="rounded-[1rem]">
                        <SafeJewelryImage
                          src={asset.fileUrl}
                          alt={title}
                          fallbackSrc={uploadPreview.src}
                          fallbackAlt={uploadPreview.alt}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                        {isSelected ? (
                          <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                            <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </JewelryImageFrame>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {hasSource && !shouldShowSupportingPanel ? (
            <button
              type="button"
              onClick={() => setSupportingPanelOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 py-2.5 text-right transition hover:border-white/18 hover:bg-white/[0.07]"
            >
              <span className="min-w-0">
                <span className="block text-xs font-medium text-surface/78">{content.supportingTriggerTitle}</span>
                <span className="mt-0.5 block text-[11px] leading-5 text-surface/48">{content.supportingTriggerDescription}</span>
              </span>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-surface/72">
                <Add aria-hidden={true} className="h-4 w-4" />
              </span>
            </button>
          ) : null}

          {hasSource && shouldShowSupportingPanel ? (
            <section className="space-y-3 rounded-[1rem] border border-white/10 bg-white/[0.045] px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-surface/82">{content.supportingSectionTitle}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] leading-4 text-surface/56">
                      اختیاری
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-surface/54">
                    {content.supportingSectionDescription}
                  </p>
                </div>
                {!hasSupportingAssets ? (
                  <button
                    type="button"
                    onClick={() => setSupportingPanelOpen(false)}
                    aria-label="بستن زاویه‌های کمکی"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-surface/64 transition hover:bg-white/[0.09]"
                  >
                    <CloseCircle aria-hidden={true} className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              {hasSupportingAssets ? (
                <div className="grid grid-cols-2 gap-3">
                  {supportingAssets.map((asset) => {
                    const title = asset.title || asset.visionShortTitle || asset.originalName || content.supportingFallbackTitle;

                    return (
                      <div key={asset.id} className="relative">
                        <JewelryImageFrame aspect="square" treatment="quiet" className="rounded-[1rem]">
                          <SafeJewelryImage
                            src={asset.fileUrl}
                            alt={title}
                            fallbackSrc={uploadPreview.src}
                            fallbackAlt={uploadPreview.alt}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                          <button
                            type="button"
                            onClick={() => removeSupportingAsset(asset.id)}
                            aria-label="حذف زاویه کمکی"
                            className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/24 bg-black/34 text-white backdrop-blur transition hover:bg-black/48"
                          >
                            <CloseCircle aria-hidden={true} className="h-4 w-4" />
                          </button>
                        </JewelryImageFrame>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] leading-5 text-surface/46">
                  {supportingAssets.length.toLocaleString("fa-IR")} از {MAX_SUPPORTING_PRODUCT_IMAGES.toLocaleString("fa-IR")} عکس
                </p>
                <label
                  htmlFor="project-supporting-file-input"
                  aria-disabled={!canAddSupportingAsset}
                  className={buttonClasses({
                    variant: "studio-secondary",
                    className: `min-h-9 shrink-0 rounded-full px-3 text-xs ${!canAddSupportingAsset ? "pointer-events-none opacity-45" : ""}`,
                  })}
                >
                  <Add aria-hidden={true} className="h-3.5 w-3.5" />
                  {content.supportingAddLabel}
                </label>
              </div>
            </section>
          ) : null}

          <ActionDock columns={hasSource ? 2 : 1} className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            {hasSource ? (
              <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={clearSource}>
                تغییر عکس
              </Button>
            ) : null}
            <Button type="button" variant="studio-primary" className="h-12 w-full" onClick={() => setStep("size")} disabled={!canContinue}>
              {sourcePreparing ? "آماده‌سازی..." : "ادامه"}
              <ArrowLeft aria-hidden={true} className="h-4 w-4" />
            </Button>
          </ActionDock>
        </StepScrollPanel>
      ) : null}

      {step === "size" ? (
        <StepScrollPanel>
          <section className="rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-3">
            <p className="mb-2 block text-xs font-medium text-surface/72">
              ابعاد خروجی
            </p>
            <SegmentedControl items={outputPresetItems} value={outputPreset} onChange={setOutputPreset} label="انتخاب سایز خروجی" />
          </section>

          <section className="rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-3">
            <label htmlFor="new-project-product-type" className="mb-2 block text-xs font-medium text-surface/72">
              {content.productTypeFieldLabel} ({content.productTypeHelp})
            </label>
            <div className="relative">
              <select
                id="new-project-product-type"
                value={productType}
                onChange={(event) => setProductType(normalizeProductType(event.target.value, vertical))}
                className="min-h-10 w-full appearance-none rounded-full border border-white/12 bg-white/[0.08] py-0 pr-3 pl-10 text-sm font-semibold text-surface outline-none transition focus:border-white/28"
              >
                {productTypes.map((item) => (
                  <option key={item} value={item} className="bg-[#171411] text-white">
                    {productTypeLabel(item, vertical)}
                  </option>
                ))}
              </select>
              <ArrowDown2 aria-hidden={true} className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface/72" />
            </div>
          </section>

          {hasSource && shouldOfferSupportingOnSizeStep && !shouldShowSupportingPanel ? (
            <button
              type="button"
              onClick={() => setSupportingPanelOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 py-2.5 text-right transition hover:border-white/18 hover:bg-white/[0.07]"
            >
              <span className="min-w-0">
                <span className="block text-xs font-medium text-surface/78">{content.supportingTriggerTitle}</span>
                <span className="mt-0.5 block text-[11px] leading-5 text-surface/48">{content.supportingTriggerDescription}</span>
              </span>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-surface/72">
                <Add aria-hidden={true} className="h-4 w-4" />
              </span>
            </button>
          ) : null}

          {hasSource && shouldOfferSupportingOnSizeStep && shouldShowSupportingPanel ? (
            <section className="space-y-3 rounded-[1rem] border border-white/10 bg-white/[0.045] px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-surface/82">{content.supportingSectionTitle}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] leading-4 text-surface/56">
                      اختیاری
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-surface/54">
                    {content.supportingSectionDescription}
                  </p>
                </div>
                {!hasSupportingAssets ? (
                  <button
                    type="button"
                    onClick={() => setSupportingPanelOpen(false)}
                    aria-label="بستن زاویه‌های کمکی"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-surface/64 transition hover:bg-white/[0.09]"
                  >
                    <CloseCircle aria-hidden={true} className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              {hasSupportingAssets ? (
                <div className="grid grid-cols-2 gap-3">
                  {supportingAssets.map((asset) => {
                    const title = asset.title || asset.visionShortTitle || asset.originalName || content.supportingFallbackTitle;

                    return (
                      <div key={asset.id} className="relative">
                        <JewelryImageFrame aspect="square" treatment="quiet" className="rounded-[1rem]">
                          <SafeJewelryImage
                            src={asset.fileUrl}
                            alt={title}
                            fallbackSrc={uploadPreview.src}
                            fallbackAlt={uploadPreview.alt}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                          <button
                            type="button"
                            onClick={() => removeSupportingAsset(asset.id)}
                            aria-label="حذف زاویه کمکی"
                            className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/24 bg-black/34 text-white backdrop-blur transition hover:bg-black/48"
                          >
                            <CloseCircle aria-hidden={true} className="h-4 w-4" />
                          </button>
                        </JewelryImageFrame>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] leading-5 text-surface/46">
                  {supportingAssets.length.toLocaleString("fa-IR")} از {MAX_SUPPORTING_PRODUCT_IMAGES.toLocaleString("fa-IR")} عکس
                </p>
                <label
                  htmlFor="project-supporting-file-input"
                  aria-disabled={!canAddSupportingAsset}
                  className={buttonClasses({
                    variant: "studio-secondary",
                    className: `min-h-9 shrink-0 rounded-full px-3 text-xs ${!canAddSupportingAsset ? "pointer-events-none opacity-45" : ""}`,
                  })}
                >
                  <Add aria-hidden={true} className="h-3.5 w-3.5" />
                  {content.supportingAddLabel}
                </label>
              </div>
            </section>
          ) : null}

          <ActionDock className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" columns={2}>
            <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={() => setStep("source")}>
              بازگشت
            </Button>
            <Button type="button" variant="studio-primary" className="h-12 w-full" onClick={() => setStep("style")} disabled={!canContinue}>
              {sourcePreparing ? "آماده‌سازی..." : "ادامه"}
              <ArrowLeft aria-hidden={true} className="h-4 w-4" />
            </Button>
          </ActionDock>
        </StepScrollPanel>
      ) : null}

      {step === "style" ? (
        <StepScrollPanel>
          <div className="grid grid-cols-3 gap-2">
              {styles.map((preset) => {
                const checked = selectedStyle === preset.id;
                return (
                  <label
                    key={preset.id}
                    className={`relative overflow-hidden rounded-[1rem] border transition ${
                      checked ? "border-accent-bright bg-surface/12 ring-1 ring-accent-bright/45" : "border-white/12 bg-white/[0.04]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="styleId"
                      value={preset.id}
                      checked={checked}
                      onChange={() => selectStyle(preset)}
                      className="sr-only"
                    />
                    <JewelryImageFrame aspect="square" treatment="quiet" className="rounded-none border-0 bg-transparent shadow-none">
                      <Image
                        src={preset.previewImageUrl}
                        alt={preset.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 24vw, 140px"
                      />
                    </JewelryImageFrame>
                    <div className="px-2 py-1.5">
                      <p className="truncate text-[10px] font-semibold leading-4 text-surface">{preset.label}</p>
                    </div>
                    {checked ? (
                      <span className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-surface">
                        <TickCircle aria-hidden={true} className="h-3 w-3" />
                      </span>
                    ) : null}
                  </label>
                );
              })}
          </div>

          {styleControls.length > 0 ? (
            <section className="grid grid-cols-2 gap-2 rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-3">
              {styleControls.filter((control) => shouldShowStyleControl(control, styleControlValues)).map((control) => {
                const value = getResolvedStyleControlValue(control, styleControlValues);
                const choiceOptions = parseChoiceOptions(control.optionsJson);

                if (control.type === "CHOICE" && choiceOptions.length > 0) {
                  if (control.key === "modelGender") {
                    return (
                      <StyleSegmentedChoiceControl
                        key={control.key}
                        controlKey={control.key}
                        label={control.label}
                        options={choiceOptions}
                        value={value}
                        onChange={(nextValue) => setStyleControlValue(control.key, nextValue)}
                      />
                    );
                  }

                  return (
                    <StyleChoiceControl
                      key={control.key}
                      controlKey={control.key}
                      label={control.label}
                      options={choiceOptions}
                      value={value}
                      open={openStyleControl === control.key}
                      onChange={(nextValue) => setStyleControlValue(control.key, nextValue)}
                      onOpenChange={(open) => setOpenStyleControl(open ? control.key : null)}
                    />
                  );
                }

                if (control.type === "RANGE") {
                  return (
                    <StyleRangeControl
                      key={control.key}
                      controlKey={control.key}
                      label={control.label}
                      value={value}
                      min={control.minValue ?? 0}
                      max={control.maxValue ?? 100}
                      open={openStyleControl === control.key}
                      onChange={(nextValue) => setStyleControlValue(control.key, nextValue)}
                      onOpenChange={(open) => setOpenStyleControl(open ? control.key : null)}
                    />
                  );
                }

                return (
                  <StyleToggleControl
                    key={control.key}
                    controlKey={control.key}
                    label={control.label}
                    active={value === "true"}
                    onChange={(active) => setStyleControlValue(control.key, active ? "true" : "false")}
                  />
                );
              })}
            </section>
          ) : null}

          {isSampleReferenceStyle ? (
            <section className="space-y-3 rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-surface/72">{content.sampleReferenceTitle}</p>
                <label htmlFor="project-reference-file-input" className={buttonClasses({ variant: "studio-secondary", className: "min-h-9 rounded-full px-3 text-xs" })}>
                  <DocumentUpload aria-hidden={true} className="h-3.5 w-3.5" />
                  آپلود
                </label>
              </div>
              {readyStyleReferences.length > 0 || styleReferences.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {readyStyleReferences.map((reference) => {
                    const checked = selectedReadySampleId === reference.id;
                    const title = reference.title;

                    return (
                      <button
                        key={`ready-${reference.id}`}
                        type="button"
                        onClick={() => selectReadyReference(reference)}
                        aria-label={`انتخاب ${title}`}
                        className="text-right"
                      >
                        <JewelryImageFrame aspect="square" selected={checked} treatment="quiet" className="rounded-[1rem]">
                          <SafeJewelryImage
                            src={reference.fileUrl}
                            alt={reference.alt}
                            fallbackSrc={uploadPreview.src}
                            fallbackAlt={uploadPreview.alt}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                          {checked ? (
                            <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                              <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                            </span>
                          ) : null}
                        </JewelryImageFrame>
                      </button>
                    );
                  })}
                  {styleReferences.map((reference) => {
                    const checked = selectedReference?.id === reference.id;
                    const title = reference.title || reference.originalName || content.sampleReferenceTitle;

                    return (
                      <button
                        key={reference.id}
                        type="button"
                        onClick={() => selectReference(reference)}
                        aria-label={`انتخاب ${title}`}
                        className="text-right"
                      >
                        <JewelryImageFrame aspect="square" selected={checked} treatment="quiet" className="rounded-[1rem]">
                          <SafeJewelryImage
                            src={reference.fileUrl}
                            alt={title}
                            fallbackSrc={uploadPreview.src}
                            fallbackAlt={uploadPreview.alt}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                          {checked ? (
                            <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                              <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                            </span>
                          ) : null}
                        </JewelryImageFrame>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {referenceUploadPreview ? (
                <div className="flex items-center gap-3 rounded-[0.9rem] border border-white/14 bg-white/[0.04] px-3 py-2">
                  <JewelryImageFrame aspect="square" selected treatment="quiet" className="h-16 w-16 shrink-0 rounded-[0.9rem]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={referenceUploadPreview} alt={`پیش‌نمایش ${content.sampleReferenceTitle}`} className="h-full w-full object-cover" />
                  </JewelryImageFrame>
                  <div className="flex min-w-0 items-center gap-2 text-xs text-surface/84">
                    <ImageIcon aria-hidden={true} className="h-4 w-4 shrink-0 text-accent-bright" />
                    <span>{content.uploadedSampleLabel}</span>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {state.error || sourceError ? (
            <div className="rounded-[1rem] border border-danger/24 bg-danger-soft/92 px-3 py-3 text-danger shadow-[0_18px_32px_-26px_rgba(152,59,52,0.42)]">
              <p className="text-sm font-semibold">این مرحله کامل نشد</p>
              <p
                className="mt-1 text-[12px] leading-6 text-danger/88"
                style={{ textAlign: "justify", textAlignLast: "right" }}
              >
                {sourceError || state.error}
              </p>
              {shouldShowBillingShortcut ? (
                <ButtonLink href="/billing" variant="ghost" className="mt-3 min-h-10 px-0 text-sm !text-danger hover:!text-danger/88">
                  رفتن به صفحه اعتبار
                  <ArrowLeft aria-hidden={true} className="h-4 w-4" />
                </ButtonLink>
              ) : null}
            </div>
          ) : null}

          <ActionDock className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" columns={2}>
            <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={() => setStep("size")}>
              بازگشت
            </Button>
            <Button type="submit" disabled={pending || !canSubmitWithReference} variant="studio-primary" className="h-12 w-full">
              {sourcePreparing ? "آماده‌سازی..." : pending ? "در حال ساخت..." : "شروع پردازش"}
              <Magicpen aria-hidden={true} className="h-4 w-4" />
            </Button>
          </ActionDock>
        </StepScrollPanel>
      ) : null}
    </form>
    {cropUploadId ? <GalleryCropScreen uploadId={cropUploadId} onClose={handleCropClose} /> : null}
    </>
  );
}



