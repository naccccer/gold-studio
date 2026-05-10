"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  DocumentUpload,
  Gallery,
  Magicpen,
  TickCircle,
} from "vuesax-icons-react";
import { ActionDock } from "@/components/ui/action-dock";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { ImageOverlayPill, JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { ProjectFormState } from "@/features/projects/actions";
import type { StyleControlOption, StyleOption } from "@/features/projects/presets";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";

const INITIAL_STATE: ProjectFormState = {};

export type GalleryAssetOption = {
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
  selectedAssetId?: string;
  styles: StyleOption[];
  defaultOutputPreset?: OutputPresetId;
};

type OutputPresetId = "post" | "story" | "banner";
type WizardStep = "source" | "size" | "style";

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
    title: "قاب خروجی را مشخص کنید",
    description: "همان عکسی که انتخاب کرده‌اید در نسبت نهایی بازسازی می‌شود.",
  },
  style: {
    stepNumber: "مرحله ۳ از ۳",
    title: "سبک خروجی را نهایی کنید",
    description: "یک ظاهر آماده را انتخاب کنید تا پردازش استودیویی شروع شود.",
  },
};

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

export function NewProjectForm({
  action,
  galleryAssets,
  selectedAssetId,
  styles,
  defaultOutputPreset = "post",
}: NewProjectFormProps) {
  const explicitSelectedAsset = selectedAssetId
    ? galleryAssets.find((asset) => asset.id === selectedAssetId) ?? null
    : null;
  const defaultStyle = styles[0];
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [step, setStep] = useState<WizardStep>(explicitSelectedAsset ? "size" : "source");
  const [selectedAsset, setSelectedAsset] = useState<GalleryAssetOption | null>(explicitSelectedAsset);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputPreset, setOutputPreset] = useState<OutputPresetId>(defaultOutputPreset);
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle?.id ?? "");
  const [modelGender, setModelGender] = useState("woman");
  const [modesty, setModesty] = useState("65");

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
  const modelControls = selectedStyleData?.controls ?? [];
  const genderControl = modelControls.find((control) => control.key === "modelGender");
  const modestyControl = modelControls.find((control) => control.key === "modesty");
  const genderOptions = parseChoiceOptions(genderControl?.optionsJson);
  const visibleGalleryAssets = galleryAssets.slice(0, 4);
  const currentImageSrc = previewUrl ?? selectedAsset?.fileUrl ?? null;
  const hasSource = Boolean(currentImageSrc);
  const canSubmit = Boolean(selectedStyleData) && hasSource;
  const currentMeta = stepMeta[step];

  function setPreview(file: File | null) {
    if (file) {
      setSelectedAsset(null);
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

  function selectAsset(asset: GalleryAssetOption) {
    setSelectedAsset(asset);
    setPreviewUrl((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
      return null;
    });
  }

  function clearSource() {
    setSelectedAsset(null);
    setPreviewUrl((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
      return null;
    });
  }

  function selectStyle(style: StyleOption) {
    const nextGenderControl = style.controls?.find((control) => control.key === "modelGender");
    const nextModestyControl = style.controls?.find((control) => control.key === "modesty");

    setSelectedStyle(style.id);
    setModelGender(nextGenderControl?.defaultValue ?? "woman");
    setModesty(nextModestyControl?.defaultValue ?? "65");
  }

  return (
    <form action={formAction} className="flex h-[calc(100svh-12rem)] flex-col gap-4 overflow-hidden">
      <input type="hidden" name="generationMode" value="image" />
      <input type="hidden" name="outputPreset" value={outputPreset} />
      <input type="hidden" name="modelGender" value={modelGender} />
      <input type="hidden" name="modesty" value={modesty} />
      {selectedAsset ? <input type="hidden" name="sourceAssetId" value={selectedAsset.id} /> : null}

      <input
        id="project-camera-input"
        name="image"
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          setPreview(event.target.files?.[0] ?? null);
        }}
      />
      <input
        id="project-file-input"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          setPreview(event.target.files?.[0] ?? null);
        }}
      />

      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-accent-deep">{currentMeta.stepNumber}</p>
            <h2 className="text-lg font-semibold text-surface">{currentMeta.title}</h2>
          </div>
          <ImageOverlayPill tone="dark" className="shrink-0">
            {selectedPreset.label}
          </ImageOverlayPill>
        </div>
        <p className="text-xs leading-6 text-surface/72">{currentMeta.description}</p>
        <div className="flex items-center gap-2" aria-label="مراحل پروژه">
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
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <JewelryImageFrame
            aspect="portrait"
            treatment="dark"
            className="h-[min(312px,38svh)] min-h-[248px] w-full rounded-[1.45rem]"
          >
            <Image
              src={currentImageSrc || uploadPreview.src}
              alt="تصویر انتخاب‌شده"
              fill
              priority
              className={`object-cover object-[46%_55%] ${currentImageSrc ? "" : "opacity-72"}`}
              sizes="(max-width: 768px) 100vw, 760px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/76 via-black/18 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
              <ImageOverlayPill tone="dark" className="w-fit">
                {selectedAsset ? "از گالری" : previewUrl ? "آپلود جدید" : "شروع پروژه"}
              </ImageOverlayPill>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-surface">
                  {selectedAsset?.title || selectedAsset?.originalName || (previewUrl ? "عکس آماده بررسی" : "یک عکس تمیز از محصول انتخاب کنید")}
                </p>
                <p className="text-xs leading-6 text-surface/72">
                  {hasSource
                    ? "این عکس منبع اصلی ساخت خواهد بود."
                    : "محصول را تا حد ممکن نزدیک و واضح بگیرید تا نتیجه نهایی دقیق‌تر شود."}
                </p>
              </div>
            </div>
          </JewelryImageFrame>

          <div className="grid grid-cols-3 gap-2">
            <label htmlFor="project-camera-input" className={buttonClasses({ variant: "studio-secondary", className: "h-12 px-2 text-xs" })}>
              <Camera aria-hidden={true} className="h-4 w-4" />
              دوربین
            </label>
            <label htmlFor="project-file-input" className={buttonClasses({ className: "h-12 px-2 text-xs" })}>
              <DocumentUpload aria-hidden={true} className="h-4 w-4" />
              آپلود
            </label>
            <ButtonLink href="/gallery" variant="studio-secondary" className="h-12 px-2 text-xs">
              <Gallery aria-hidden={true} className="h-4 w-4" />
              گالری
            </ButtonLink>
          </div>

          {visibleGalleryAssets.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-surface/72">انتخاب سریع از گالری</p>
                {galleryAssets.length > visibleGalleryAssets.length ? (
                  <ButtonLink href="/gallery" variant="ghost" className="min-h-8 px-0 text-xs !text-surface/72 hover:!text-surface">
                    دیدن همه
                  </ButtonLink>
                ) : null}
              </div>
              <div className="grid grid-cols-4 gap-2">
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

          <ActionDock columns={hasSource ? 2 : 1} className="mt-auto">
            {hasSource ? (
              <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={clearSource}>
                تغییر عکس
              </Button>
            ) : null}
            <Button type="button" variant="studio-primary" className="h-12 w-full" onClick={() => setStep("size")} disabled={!hasSource}>
              ادامه
              <ArrowLeft aria-hidden={true} className="h-4 w-4" />
            </Button>
          </ActionDock>
        </section>
      ) : null}

      {step === "size" ? (
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <JewelryImageFrame
            aspect="portrait"
            treatment="dark"
            className="flex h-[min(312px,38svh)] min-h-[248px] items-center justify-center rounded-[1.45rem]"
          >
            {selectedAsset ? (
              <SafeJewelryImage
                src={selectedAsset.fileUrl}
                alt={selectedAsset.title || selectedAsset.originalName || "تصویر محصول"}
                fallbackSrc={uploadPreview.src}
                fallbackAlt={uploadPreview.alt}
                fill
                priority
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`rounded-[1.25rem] border border-white/55 bg-white/10 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.72)] backdrop-blur-sm ${selectedPreset.previewFrameClassName}`} />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
              <div className="space-y-1">
                <ImageOverlayPill tone="dark" className="w-fit">
                  قاب {selectedPreset.label}
                </ImageOverlayPill>
                <p className="text-xs leading-6 text-surface/72">خروجی نهایی با همین نسبت ساخته می‌شود.</p>
              </div>
              <div className="rounded-full border border-white/18 bg-black/28 px-3 py-1 text-xs font-medium text-surface/82" dir="ltr">
                {selectedPreset.ratio}
              </div>
            </div>
          </JewelryImageFrame>

          <fieldset className="space-y-3">
            <legend className="sr-only">انتخاب سایز خروجی</legend>
            <SegmentedControl items={outputPresetItems} value={outputPreset} onChange={setOutputPreset} label="انتخاب سایز خروجی" />
            <div className="grid grid-cols-3 gap-2">
              {outputPresets.map((preset) => {
                const active = selectedPreset.id === preset.id;
                return (
                  <div key={preset.id} className={`rounded-[1rem] border px-3 py-3 ${active ? "border-accent-bright bg-accent-wash/52" : "border-white/12 bg-white/[0.06]"}`}>
                    <span className={`mx-auto block rounded-[0.7rem] border ${active ? "border-accent-bright/70 bg-white/18" : "border-white/24 bg-white/[0.04]"} ${preset.className}`} />
                  </div>
                );
              })}
            </div>
          </fieldset>

          <ActionDock className="mt-auto" columns={2}>
            <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={() => setStep("source")}>
              بازگشت
            </Button>
            <Button type="button" variant="studio-primary" className="h-12 w-full" onClick={() => setStep("style")} disabled={!hasSource}>
              ادامه
              <ArrowLeft aria-hidden={true} className="h-4 w-4" />
            </Button>
          </ActionDock>
        </section>
      ) : null}

      {step === "style" ? (
        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <JewelryImageFrame
            aspect="landscape"
            treatment="dark"
            className="h-[min(240px,28svh)] min-h-[196px] rounded-[1.45rem]"
          >
            <Image
              src={selectedStyleData?.previewImageUrl || uploadPreview.src}
              alt={selectedStyleData?.label || "پیش‌نمایش سبک"}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 760px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
              <div className="space-y-1">
                <ImageOverlayPill tone="dark" className="w-fit">
                  سبک انتخابی
                </ImageOverlayPill>
                <p className="text-sm font-semibold text-surface">{selectedStyleData?.label || "سبک آماده"}</p>
                {selectedStyleData?.description ? (
                  <p className="max-w-[16rem] text-xs leading-6 text-surface/72">{selectedStyleData.description}</p>
                ) : null}
              </div>
              <div className="rounded-full border border-white/18 bg-black/28 px-3 py-1 text-xs font-medium text-surface/82">
                {selectedPreset.label}
              </div>
            </div>
          </JewelryImageFrame>

          <div className="grid grid-cols-3 gap-2">
            {styles.map((preset) => {
              const checked = selectedStyle === preset.id;
              return (
                <label
                  key={preset.id}
                  className={`relative overflow-hidden rounded-[1rem] border transition ${
                    checked ? "border-accent-bright bg-surface ring-1 ring-accent-bright/45" : "border-white/12 bg-white/[0.06]"
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
                      sizes="(max-width: 768px) 30vw, 180px"
                    />
                  </JewelryImageFrame>
                  <p className="truncate px-2 py-2 text-[10px] font-medium leading-5 text-surface">{preset.label}</p>
                  {checked ? (
                    <span className="absolute left-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                      <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>

          {genderOptions.length > 0 || modestyControl ? (
            <section className="space-y-3 rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-3">
              {genderOptions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setModelGender(item.value)}
                      className={buttonClasses({
                        variant: modelGender === item.value ? "secondary" : "ghost",
                        className: "min-h-11 border border-white/14 text-sm !text-surface",
                      })}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {modestyControl ? (
                <label className="block space-y-2">
                  <span className="text-xs text-surface/72">{modestyControl.label}</span>
                  <input
                    type="range"
                    min={modestyControl.minValue ?? 35}
                    max={modestyControl.maxValue ?? 90}
                    value={modesty}
                    onChange={(event) => setModesty(event.target.value)}
                    className="w-full accent-accent-bright"
                  />
                </label>
              ) : null}
            </section>
          ) : null}

          {state.error ? (
            <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          ) : null}

          <ActionDock className="mt-auto" columns={2}>
            <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={() => setStep("size")}>
              بازگشت
            </Button>
            <Button type="submit" disabled={pending || !canSubmit} variant="studio-primary" className="h-12 w-full">
              {pending ? "در حال ساخت..." : "شروع پردازش"}
              <Magicpen aria-hidden={true} className="h-4 w-4" />
            </Button>
          </ActionDock>
        </section>
      ) : null}
    </form>
  );
}
