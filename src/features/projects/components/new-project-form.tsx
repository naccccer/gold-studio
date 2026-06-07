"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronsDown, ChevronLeft, Camera, Upload, Images, Image as ImageIcon, Wand2, CheckCircle } from "lucide-react";
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
import { StyleChoiceControl } from "@/features/projects/components/style-choice-control";
import type { StyleControlOption, StyleOption } from "@/features/projects/presets";
import { NO_CREDITS_ERROR } from "@/lib/credits";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { DEFAULT_PRODUCT_TYPE, normalizeProductType, productTypeLabel, PRODUCT_TYPES } from "@/lib/product-types";

const INITIAL_STATE: ProjectFormState = {};

export type GalleryAssetOption = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
  productType: string | null;
};

export type StyleReferenceOption = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
};

type NewProjectFormProps = {
  action: (
    prevState: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  galleryAssets: GalleryAssetOption[];
  styleReferences: StyleReferenceOption[];
  selectedAssetId?: string;
  freeVariantParentId?: string;
  styles: StyleOption[];
  defaultOutputPreset?: OutputPresetId;
  initialStep?: WizardStep;
};

type OutputPresetId = "post" | "story" | "banner";
type WizardStep = "source" | "size" | "style";
type StyleControl = NonNullable<StyleOption["controls"]>[number];

const topBarTitles: Record<WizardStep, string> = {
  source: "آپلود عکس محصول",
  size: "ابعاد و نوع محصول",
  style: "انتخاب سبک",
};

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
}: {
  children: React.ReactNode;
  htmlFor?: string;
  href?: string;
  featured?: boolean;
}) {
  const className =
    featured
      ? "h-12 w-full rounded-[1rem] border border-white bg-white text-xs font-semibold !text-[#171411] shadow-[0_18px_30px_-24px_rgba(255,255,255,0.82)] hover:bg-[#fff8ef]"
      : "h-12 w-full rounded-[1rem] border border-white/14 bg-white/[0.06] text-xs font-semibold !text-surface shadow-none hover:border-white/24 hover:bg-white/[0.1]";

  if (href) {
    return (
      <ButtonLink href={href} variant="studio-secondary" className={className}>
        {children}
      </ButtonLink>
    );
  }

  return (
    <label htmlFor={htmlFor} className={buttonClasses({ variant: featured ? "light" : "studio-secondary", className })}>
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

export function NewProjectForm({
  action,
  galleryAssets,
  styleReferences,
  selectedAssetId,
  freeVariantParentId,
  styles,
  defaultOutputPreset = "post",
  initialStep,
}: NewProjectFormProps) {
  const router = useRouter();
  const explicitSelectedAsset = selectedAssetId
    ? galleryAssets.find((asset) => asset.id === selectedAssetId) ?? null
    : null;
  const defaultStyle = styles[0];
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
  const [cropUploadId, setCropUploadId] = useState<string | null>(null);
  const [outputPreset, setOutputPreset] = useState<OutputPresetId>(defaultOutputPreset);
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle?.id ?? "");
  const [selectedReference, setSelectedReference] = useState<StyleReferenceOption | null>(null);
  const [referenceUploadPreview, setReferenceUploadPreview] = useState<string | null>(null);
  const [styleControlValues, setStyleControlValues] = useState<Record<string, string>>(() => getInitialStyleControlValues(defaultStyle));
  const [productType, setProductType] = useState(normalizeProductType(explicitSelectedAsset?.productType));
  const [sourcePreparing, setSourcePreparing] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const fileInputRequestRef = useRef(0);

  const selectedStyleData = useMemo(
    () => styles.find((preset) => preset.id === selectedStyle) ?? defaultStyle,
    [defaultStyle, selectedStyle, styles],
  );

  const styleControls = selectedStyleData?.controls ?? [];
  const isSampleReferenceStyle = selectedStyleData?.id === "style_sample_reference";
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
  const canContinue = hasSource && !sourcePreparing && !sourceError;
  const canSubmit = Boolean(selectedStyleData) && canContinue;
  const canSubmitWithReference = canSubmit && (!isSampleReferenceStyle || Boolean(selectedReference || referenceUploadPreview));
  const shouldShowBillingShortcut = state.error === NO_CREDITS_ERROR;

  useEffect(() => {
    return () => {
      if (referenceUploadPreview) {
        URL.revokeObjectURL(referenceUploadPreview);
      }
    };
  }, [referenceUploadPreview]);

  function beginGalleryUploadCrop(file: File, source: PendingUploadSource) {
    fileInputRequestRef.current += 1;
    setSourcePreparing(true);
    setSourceError(null);
    setSelectedAsset(null);
    setProductType(DEFAULT_PRODUCT_TYPE);

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
    beginGalleryUploadCrop(file, input.id === "project-camera-input" ? "camera" : "files");
  }

  function selectAsset(asset: GalleryAssetOption) {
    fileInputRequestRef.current += 1;
    setSourcePreparing(false);
    setSourceError(null);
    setSelectedAsset(asset);
    setProductType(normalizeProductType(asset.productType));
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
    setCropUploadId(null);
  }

  function selectStyle(style: StyleOption) {
    setSelectedStyle(style.id);
    setStyleControlValues(getInitialStyleControlValues(style));
  }

  function selectReference(reference: StyleReferenceOption) {
    const input = document.getElementById("project-reference-file-input");
    if (input instanceof HTMLInputElement) {
      input.value = "";
    }
    setReferenceUploadPreview(null);
    setSelectedReference(reference);
  }

  function setStyleControlValue(key: string, value: string) {
    setStyleControlValues((current) => ({ ...current, [key]: value }));
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

  function handleCropClose(options?: { refresh?: boolean; selectedAssetId?: string; selectedAssetFileUrl?: string }) {
    setCropUploadId(null);
    setSourcePreparing(false);

    if (options?.selectedAssetId && options.selectedAssetFileUrl) {
      const uploadedAsset: GalleryAssetOption = {
        id: options.selectedAssetId,
        fileUrl: options.selectedAssetFileUrl,
        title: null,
        originalName: null,
        productType,
      };

      selectAsset(uploadedAsset);
      setStep("size");
    }

    if (options?.refresh) {
      router.refresh();
    }
  }

  return (
    <>
    <form action={formAction} className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <AppTopBar
        title={step === "source" ? "آپلود عکس محصول" : topBarTitles[step]}
        onBack={handleTopBarBack}
        logoVariant="mark-light"
        tone="dark"
        className="mb-0 min-h-12 px-0"
      />
      <input type="hidden" name="generationMode" value="image" />
      <input type="hidden" name="outputPreset" value={outputPreset} />
      {styleControls.map((control) => (
        <input key={control.key} type="hidden" name={`styleControl_${control.key}`} value={styleControlValues[control.key] ?? getControlDefaultValue(control)} />
      ))}
      {freeVariantParentId ? <input type="hidden" name="freeVariantParentId" value={freeVariantParentId} /> : null}
      {selectedAsset ? <input type="hidden" name="sourceAssetId" value={selectedAsset.id} /> : null}
      {selectedReference ? <input type="hidden" name="referenceAssetId" value={selectedReference.id} /> : null}
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
          setReferenceUploadPreview((current) => {
            if (current) {
              URL.revokeObjectURL(current);
            }

            return file ? URL.createObjectURL(file) : null;
          });
        }}
      />

      {step === "source" ? (
        <StepScrollPanel>
          <div className="grid grid-cols-3 gap-3">
            <SourceActionButton htmlFor="project-file-input" featured>
              <Upload aria-hidden={true} className="h-4 w-4" />
              <span>آپلود</span>
            </SourceActionButton>
            <SourceActionButton htmlFor="project-camera-input">
              <Camera aria-hidden={true} className="h-4 w-4" />
              <span>دوربین</span>
            </SourceActionButton>
            <SourceActionButton href="/gallery">
              <Images aria-hidden={true} className="h-4 w-4" />
              <span>گالری</span>
            </SourceActionButton>
          </div>

          {sourcePreparing ? (
            <p className="rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-2 text-xs leading-6 text-surface/72">
              در حال آماده‌سازی عکس برای آپلود...
            </p>
          ) : null}

          {sourceError ? (
            <div className="rounded-[1rem] border border-danger/24 bg-danger-soft/92 px-3 py-3 text-danger shadow-[0_18px_32px_-26px_rgba(152,59,52,0.42)]">
              <p className="text-sm font-semibold">عکس آماده نشد</p>
              <p className="mt-1 text-[12px] leading-6 text-danger/88">{sourceError}</p>
            </div>
          ) : null}

          {visibleGalleryAssets.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-surface/72">انتخاب سریع از گالری</p>
                {galleryAssets.length > visibleGalleryAssets.length ? (
                  <ButtonLink href="/gallery" variant="ghost" className="min-h-8 px-0 text-xs !text-surface/72 hover:!text-surface">
                    دیدن همه
                  </ButtonLink>
                ) : null}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {visibleGalleryAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const title = asset.title || asset.originalName || "تصویر محصول";

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
                            <CheckCircle aria-hidden={true} className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </JewelryImageFrame>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <ActionDock columns={hasSource ? 2 : 1} className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            {hasSource ? (
              <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={clearSource}>
                تغییر عکس
              </Button>
            ) : null}
            <Button type="button" variant="studio-primary" className="h-12 w-full" onClick={() => setStep("size")} disabled={!canContinue}>
              {sourcePreparing ? "آماده‌سازی..." : "ادامه"}
              <ChevronLeft aria-hidden={true} className="h-4 w-4" />
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
              نوع محصول (در صورت مغایرت تغییر دهید)
            </label>
            <div className="relative">
              <select
                id="new-project-product-type"
                value={productType}
                onChange={(event) => setProductType(normalizeProductType(event.target.value))}
                className="min-h-10 w-full appearance-none rounded-full border border-white/12 bg-white/[0.08] py-0 pr-3 pl-10 text-sm font-semibold text-surface outline-none transition focus:border-white/28"
              >
                {PRODUCT_TYPES.map((item) => (
                  <option key={item} value={item} className="bg-[#171411] text-white">
                    {productTypeLabel(item)}
                  </option>
                ))}
              </select>
              <ChevronsDown aria-hidden={true} className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface/72" />
            </div>
          </section>

          <ActionDock className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" columns={2}>
            <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={() => setStep("source")}>
              بازگشت
            </Button>
            <Button type="button" variant="studio-primary" className="h-12 w-full" onClick={() => setStep("style")} disabled={!canContinue}>
              {sourcePreparing ? "آماده‌سازی..." : "ادامه"}
              <ChevronLeft aria-hidden={true} className="h-4 w-4" />
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
                        <CheckCircle aria-hidden={true} className="h-3 w-3" />
                      </span>
                    ) : null}
                  </label>
                );
              })}
          </div>

          {styleControls.length > 0 ? (
            <section className="space-y-3 rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-3">
              {styleControls.map((control) => {
                const value = styleControlValues[control.key] ?? getControlDefaultValue(control);
                const choiceOptions = parseChoiceOptions(control.optionsJson);

                if (control.type === "CHOICE" && choiceOptions.length > 0) {
                  return (
                    <StyleChoiceControl
                      key={control.key}
                      controlKey={control.key}
                      label={control.label}
                      options={choiceOptions}
                      value={value}
                      onChange={(nextValue) => setStyleControlValue(control.key, nextValue)}
                    />
                  );
                }

                if (control.type === "RANGE") {
                  return (
                    <label key={control.key} className="block space-y-2">
                      <span className="flex items-center justify-between gap-3 text-xs text-surface/72">
                        <span>{control.label}</span>
                        <span className="rounded-full border border-white/14 bg-white/[0.05] px-2 py-0.5 text-[10px]" dir="ltr">
                          {value}
                        </span>
                      </span>
                      <input
                        type="range"
                        min={control.minValue ?? 0}
                        max={control.maxValue ?? 100}
                        value={value}
                        onChange={(event) => setStyleControlValue(control.key, event.target.value)}
                        className="w-full accent-accent-bright"
                      />
                    </label>
                  );
                }

                return (
                  <label key={control.key} className="flex min-h-11 items-center justify-between gap-3 rounded-[0.9rem] border border-white/14 bg-white/[0.04] px-3 py-2 text-sm text-surface/84">
                    <span>{control.label}</span>
                    <input
                      type="checkbox"
                      checked={value === "true"}
                      onChange={(event) => setStyleControlValue(control.key, event.target.checked ? "true" : "false")}
                      className="h-4 w-4 accent-accent-bright"
                    />
                  </label>
                );
              })}
            </section>
          ) : null}

          {isSampleReferenceStyle ? (
            <section className="space-y-3 rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-surface/72">عکس نمونه</p>
                <label htmlFor="project-reference-file-input" className={buttonClasses({ variant: "studio-secondary", className: "min-h-9 rounded-full px-3 text-xs" })}>
                  <Upload aria-hidden={true} className="h-3.5 w-3.5" />
                  آپلود
                </label>
              </div>
              {styleReferences.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {styleReferences.slice(0, 8).map((reference) => {
                    const checked = selectedReference?.id === reference.id;
                    const title = reference.title || reference.originalName || "عکس نمونه";

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
                              <CheckCircle aria-hidden={true} className="h-3.5 w-3.5" />
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
                    <img src={referenceUploadPreview} alt="پیش‌نمایش عکس نمونه" className="h-full w-full object-cover" />
                  </JewelryImageFrame>
                  <div className="flex min-w-0 items-center gap-2 text-xs text-surface/84">
                    <ImageIcon aria-hidden={true} className="h-4 w-4 shrink-0 text-accent-bright" />
                    <span>نمونه آپلودی</span>
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
                  <ChevronLeft aria-hidden={true} className="h-4 w-4" />
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
              <Wand2 aria-hidden={true} className="h-4 w-4" />
            </Button>
          </ActionDock>
        </StepScrollPanel>
      ) : null}
    </form>
    {cropUploadId ? <GalleryCropScreen uploadId={cropUploadId} onClose={handleCropClose} /> : null}
    </>
  );
}



