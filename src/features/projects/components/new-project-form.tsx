"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown2,
  ArrowLeft,
  Camera,
  DocumentUpload,
  Gallery,
  Magicpen,
  TickCircle,
} from "vuesax-icons-react";
import { ActionDock } from "@/components/ui/action-dock";
import { AppTopBar } from "@/components/ui/app-top-bar";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { ImageOverlayPill, JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { ProjectFormState } from "@/features/projects/actions";
import { StyleChoiceControl } from "@/features/projects/components/style-choice-control";
import type { StyleControlOption, StyleOption } from "@/features/projects/presets";
import { NO_CREDITS_ERROR } from "@/lib/credits";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { PRODUCT_TYPES } from "@/lib/product-types";

const INITIAL_STATE: ProjectFormState = {};
const MAX_PROJECT_UPLOAD_EDGE = 2400;
const MAX_PROJECT_UPLOAD_BYTES = 4 * 1024 * 1024;
const PROJECT_UPLOAD_JPEG_QUALITY = 0.86;
const PROJECT_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type GalleryAssetOption = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
  productType: string | null;
};

type NewProjectFormProps = {
  action: (
    prevState: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  galleryAssets: GalleryAssetOption[];
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
  source: "پروژه جدید",
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
  className: string;
  previewFrameClassName: string;
}> = [
  {
    id: "post",
    label: "پست",
    ratio: "۱:۱",
    className: "aspect-square",
    previewFrameClassName: "h-[62%] aspect-square",
  },
  {
    id: "story",
    label: "استوری",
    ratio: "۹:۱۶",
    className: "aspect-[9/16]",
    previewFrameClassName: "h-[78%] aspect-[9/16]",
  },
  {
    id: "banner",
    label: "بنر",
    ratio: "۱۶:۹",
    className: "aspect-video",
    previewFrameClassName: "w-[82%] aspect-video",
  },
];

const stepMeta: Record<WizardStep, { stepNumber: string; title: string; description: string }> = {
  source: {
    stepNumber: "مرحله ۱ از ۳",
    title: "عکس محصول را انتخاب کنید",
    description: "از گالری، آپلود، یا دوربین شروع کنید تا منبع اصلی پروژه مشخص شود.",
  },
  size: {
    stepNumber: "مرحله ۲ از ۳",
    title: "ابعاد خروجی را مشخص کنید",
    description: "همان عکسی که انتخاب کرده‌اید در نسبت نهایی بازسازی می‌شود.",
  },
  style: {
    stepNumber: "مرحله ۳ از ۳",
    title: "انتخاب سبک",
    description: "یک ظاهر آماده را انتخاب کنید تا پردازش استودیویی شروع شود.",
  },
};

function SourceActionButton({
  children,
  htmlFor,
  href,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  href?: string;
}) {
  const className =
    "h-12 w-full rounded-[1rem] border border-white/14 bg-white/[0.06] text-xs font-semibold !text-surface shadow-none hover:border-white/24 hover:bg-white/[0.1]";

  if (href) {
    return (
      <ButtonLink href={href} variant="studio-secondary" className={className}>
        {children}
      </ButtonLink>
    );
  }

  return (
    <label htmlFor={htmlFor} className={buttonClasses({ variant: "studio-secondary", className })}>
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

function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = new window.Image();
  image.decoding = "async";

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("تصویر انتخاب‌شده قابل آماده‌سازی نیست. لطفا از گالری یک فایل JPG، PNG یا WEBP انتخاب کنید."));
    };
    image.src = objectUrl;
  });
}

async function prepareProjectUploadFile(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const shouldNormalize = !PROJECT_UPLOAD_TYPES.has(file.type) || file.size > MAX_PROJECT_UPLOAD_BYTES;
  if (!shouldNormalize) {
    return file;
  }

  const image = await loadImageElement(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = Math.min(1, MAX_PROJECT_UPLOAD_EDGE / longestEdge);
  const outputWidth = Math.max(1, Math.round(image.naturalWidth * scale));
  const outputHeight = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    return file;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(image, 0, 0, outputWidth, outputHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", PROJECT_UPLOAD_JPEG_QUALITY);
  });

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "project-upload";
  return new File([blob], `${baseName}-optimized.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

function replaceInputFile(input: HTMLInputElement, file: File) {
  if (typeof DataTransfer === "undefined") {
    return;
  }

  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}

export function NewProjectForm({
  action,
  galleryAssets,
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputPreset, setOutputPreset] = useState<OutputPresetId>(defaultOutputPreset);
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle?.id ?? "");
  const [styleControlValues, setStyleControlValues] = useState<Record<string, string>>(() => getInitialStyleControlValues(defaultStyle));
  const [productType, setProductType] = useState(explicitSelectedAsset?.productType || "محصول");
  const [sourcePreparing, setSourcePreparing] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const fileInputRequestRef = useRef(0);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectedStyleData = useMemo(
    () => styles.find((preset) => preset.id === selectedStyle) ?? defaultStyle,
    [defaultStyle, selectedStyle, styles],
  );

  const selectedPreset = outputPresets.find((preset) => preset.id === outputPreset) ?? outputPresets[0];
  const outputPresetItems = outputPresets.map((preset) => ({
    value: preset.id,
    label: preset.label,
    badge: (
      <span className="text-[10px] font-medium text-muted" dir="ltr">
        {preset.ratio}
      </span>
    ),
  }));
  const styleControls = selectedStyleData?.controls ?? [];
  const visibleGalleryAssets = galleryAssets.slice(0, 4);
  const currentImageSrc = previewUrl ?? selectedAsset?.fileUrl ?? null;
  const hasSource = Boolean(currentImageSrc);
  const canContinue = hasSource && !sourcePreparing && !sourceError;
  const canSubmit = Boolean(selectedStyleData) && canContinue;
  const currentMeta = stepMeta[step];
  const shouldShowBillingShortcut = state.error === NO_CREDITS_ERROR;

  function setPreview(file: File | null) {
    if (file) {
      setSelectedAsset(null);
      setProductType("محصول");
      setSourceError(null);
    }

    setPreviewUrl((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
      return file ? URL.createObjectURL(file) : null;
    });

    if (file) {
      setStep("size");
    }
  }

  async function handleImageInputChange(event: React.ChangeEvent<HTMLInputElement>, otherInputId: string) {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    const requestId = fileInputRequestRef.current + 1;
    fileInputRequestRef.current = requestId;
    setSourceError(null);

    const otherInput = document.getElementById(otherInputId);
    if (otherInput instanceof HTMLInputElement) {
      otherInput.value = "";
    }

    if (!file) {
      setSourcePreparing(false);
      setPreview(null);
      return;
    }

    setPreview(file);
    setSourcePreparing(true);

    try {
      const preparedFile = await prepareProjectUploadFile(file);
      if (fileInputRequestRef.current !== requestId) {
        return;
      }
      replaceInputFile(input, preparedFile);
    } catch (error) {
      if (fileInputRequestRef.current !== requestId) {
        return;
      }
      input.value = "";
      setPreview(null);
      setSourceError(error instanceof Error ? error.message : "آماده‌سازی تصویر کامل نشد. لطفا دوباره تلاش کنید.");
    } finally {
      if (fileInputRequestRef.current === requestId) {
        setSourcePreparing(false);
      }
    }
  }

  function selectAsset(asset: GalleryAssetOption) {
    fileInputRequestRef.current += 1;
    setSourcePreparing(false);
    setSourceError(null);
    setSelectedAsset(asset);
    setProductType(asset.productType || "محصول");
    setPreviewUrl((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
      return null;
    });
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
    setPreviewUrl((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
      return null;
    });
  }

  function selectStyle(style: StyleOption) {
    setSelectedStyle(style.id);
    setStyleControlValues(getInitialStyleControlValues(style));
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

  return (
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
        <input key={control.key} type="hidden" name={`styleControl_${control.key}`} value={styleControlValues[control.key] ?? getControlDefaultValue(control)} />
      ))}
      {freeVariantParentId ? <input type="hidden" name="freeVariantParentId" value={freeVariantParentId} /> : null}
      {selectedAsset ? <input type="hidden" name="sourceAssetId" value={selectedAsset.id} /> : null}
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

      <header className="-mt-2 space-y-3">
        <div className="flex items-center justify-center">
          <ImageOverlayPill tone="accent" className="w-fit">
            {currentMeta.stepNumber}
          </ImageOverlayPill>
        </div>
        <div className="flex items-center justify-center gap-2" aria-label="مراحل پروژه">
          {(["source", "size", "style"] as WizardStep[]).map((item, index) => {
            const isActive = step === item;
            const isDone = ["source", "size", "style"].indexOf(step) > index;

            return (
              <span
                key={item}
                className={`h-1.5 rounded-full transition ${
                  isActive ? "w-9 bg-accent-bright" : isDone ? "w-6 bg-accent/60" : "w-5 bg-white/18"
                }`}
              />
            );
          })}
        </div>
      </header>

      {step === "source" ? (
        <StepScrollPanel>
          <JewelryImageFrame
            aspect="portrait"
            treatment="dark"
            className="h-[min(284px,33svh)] min-h-[216px] w-full rounded-[1.45rem]"
          >
            <Image
              src={currentImageSrc || uploadPreview.src}
              alt="تصویر انتخاب‌شده"
              fill
              priority
              unoptimized
              className={`object-cover object-[46%_55%] ${currentImageSrc ? "" : "opacity-72"}`}
              sizes="(max-width: 768px) 100vw, 760px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/74 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
              <ImageOverlayPill tone="accent" className="w-fit">
                {selectedAsset ? "از گالری" : previewUrl ? "آپلود جدید" : "شروع پروژه"}
              </ImageOverlayPill>
              <div className="space-y-1">
                <p className="text-base font-semibold leading-7 text-surface">
                  {selectedAsset?.title || selectedAsset?.originalName || (previewUrl ? "عکس آماده بررسی" : "یک عکس تمیز از محصول انتخاب کنید")}
                </p>
                <p
                  className="text-[11px] leading-5 text-surface/72"
                  style={{ textAlign: "justify", textAlignLast: "right" }}
                >
                  {hasSource
                    ? "این عکس منبع اصلی ساخت خواهد بود."
                    : "محصول را تا حد ممکن نزدیک و واضح بگیرید تا نتیجه نهایی دقیق‌تر شود."}
                </p>
              </div>
            </div>
          </JewelryImageFrame>

          <div className="grid grid-cols-3 gap-3">
            <SourceActionButton htmlFor="project-camera-input">
              <Camera aria-hidden={true} className="h-4 w-4" />
              <span>دوربین</span>
            </SourceActionButton>
            <SourceActionButton htmlFor="project-file-input">
              <DocumentUpload aria-hidden={true} className="h-4 w-4" />
              <span>آپلود</span>
            </SourceActionButton>
            <SourceActionButton href="/gallery">
              <Gallery aria-hidden={true} className="h-4 w-4" />
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
                  const isSelected = selectedAsset?.id === asset.id && !previewUrl;
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
          <JewelryImageFrame
            aspect="portrait"
            treatment="dark"
            className="flex h-[min(288px,34svh)] min-h-[224px] items-center justify-center rounded-[1.45rem]"
          >
            {selectedAsset ? (
              <SafeJewelryImage
                src={selectedAsset.fileUrl}
                alt={selectedAsset.title || selectedAsset.originalName || "تصویر محصول"}
                fallbackSrc={uploadPreview.src}
                fallbackAlt={uploadPreview.alt}
                fill
                priority
                unoptimized
                className="object-cover object-[46%_55%] opacity-72"
                sizes="(max-width: 768px) 100vw, 760px"
              />
            ) : (
              <Image
                src={currentImageSrc || uploadPreview.src}
                alt="تصویر انتخاب‌شده"
                fill
                priority
                className="object-cover object-[46%_55%] opacity-72"
                sizes="(max-width: 768px) 100vw, 760px"
              />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,253,249,0.10)_0%,rgba(17,16,14,0.20)_54%,rgba(17,16,14,0.58)_100%)]" />
            <div className="absolute inset-0 flex items-center justify-center p-5">
              <div className={`rounded-[1.25rem] border border-white/55 bg-white/10 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.72)] backdrop-blur-sm ${selectedPreset.previewFrameClassName}`} />
            </div>
          </JewelryImageFrame>

          <fieldset className="space-y-3">
            <legend className="sr-only">انتخاب سایز خروجی</legend>
            <SegmentedControl items={outputPresetItems} value={outputPreset} onChange={setOutputPreset} label="انتخاب سایز خروجی" />
          </fieldset>

          <section className="rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-3">
            <label htmlFor="new-project-product-type" className="mb-2 block text-xs font-medium text-surface/72">
              نوع محصول
            </label>
            <div className="relative">
              <select
                id="new-project-product-type"
                value={productType}
                onChange={(event) => setProductType(event.target.value)}
                className="min-h-10 w-full appearance-none rounded-full border border-white/12 bg-white/[0.08] py-0 pr-3 pl-10 text-sm font-semibold text-surface outline-none transition focus:border-white/28"
              >
                {PRODUCT_TYPES.map((item) => (
                  <option key={item} value={item} className="bg-[#171411] text-white">
                    {item}
                  </option>
                ))}
              </select>
              <ArrowDown2 aria-hidden={true} className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface/72" />
            </div>
          </section>

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
            <Button type="submit" disabled={pending || !canSubmit} variant="studio-primary" className="h-12 w-full">
              {sourcePreparing ? "آماده‌سازی..." : pending ? "در حال ساخت..." : "شروع پردازش"}
              <Magicpen aria-hidden={true} className="h-4 w-4" />
            </Button>
          </ActionDock>
        </StepScrollPanel>
      ) : null}
    </form>
  );
}
