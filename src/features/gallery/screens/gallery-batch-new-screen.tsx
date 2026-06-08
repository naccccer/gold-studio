"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronsDown, ChevronLeft, Upload, Image as ImageIcon, Wand2, CheckCircle } from "lucide-react";
import { ActionDock } from "@/components/ui/action-dock";
import { AppTopBar } from "@/components/ui/app-top-bar";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";

import { Pill } from "@/components/ui/pill";
import { ImageFrame } from "@/components/ui/image-frame";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StyleChoiceControl } from "@/features/projects/components/style-choice-control";
import type { StyleControlOption, StyleOption } from "@/features/projects/presets";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { DEFAULT_PRODUCT_TYPE, normalizeProductType, productTypeLabel, PRODUCT_TYPES } from "@/lib/product-types";

export type BatchSourceAsset = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
  productType: string | null;
};

export type BatchStyleReference = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
};

type GalleryBatchNewScreenProps = {
  assets: BatchSourceAsset[];
  styleReferences: BatchStyleReference[];
  styles: StyleOption[];
  availableCredits: number;
  error?: string | null;
  action: (formData: FormData) => Promise<void>;
};

type OutputPresetId = "post" | "story" | "banner";
type WizardStep = "assets" | "size" | "style";
type StyleControl = NonNullable<StyleOption["controls"]>[number];

const topBarTitles: Record<WizardStep, string> = {
  assets: "ساخت گروهی",
  size: "ابعاد خروجی",
  style: "انتخاب سبک",
};

const outputPresets: Array<{
  id: OutputPresetId;
  label: string;
  ratio: string;
  previewFrameClassName: string;
}> = [
  { id: "post", label: "پست", ratio: "۱:۱", previewFrameClassName: "h-[62%] aspect-square" },
  { id: "story", label: "استوری", ratio: "۹:۱۶", previewFrameClassName: "h-[78%] aspect-[9/16]" },
  { id: "banner", label: "بنر", ratio: "۱۶:۹", previewFrameClassName: "w-[82%] aspect-video" },
];

const stepMeta: Record<WizardStep, { stepNumber: string; title: string }> = {
  assets: { stepNumber: "مرحله ۱ از ۳", title: "عکس‌های انتخاب‌شده" },
  size: { stepNumber: "مرحله ۲ از ۳", title: "قاب خروجی" },
  style: { stepNumber: "مرحله ۳ از ۳", title: "سبک استودیو" },
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

function assetTitle(asset?: BatchSourceAsset) {
  return asset?.title || asset?.originalName || "تصویر محصول";
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

export function GalleryBatchNewScreen({
  assets,
  styleReferences,
  styles,
  availableCredits,
  error,
  action,
}: GalleryBatchNewScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("assets");
  const [outputPreset, setOutputPreset] = useState<OutputPresetId>("post");
  const defaultStyle = styles[0];
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle?.id ?? "");
  const [selectedReference, setSelectedReference] = useState<BatchStyleReference | null>(null);
  const [referenceUploadPreview, setReferenceUploadPreview] = useState<string | null>(null);
  const [styleControlValues, setStyleControlValues] = useState<Record<string, string>>(() => getInitialStyleControlValues(defaultStyle));
  const [productTypes, setProductTypes] = useState<Record<string, string>>(() =>
    Object.fromEntries(assets.map((asset) => [asset.id, normalizeProductType(asset.productType)])),
  );
  const requiredCredits = assets.length;
  const hasEnoughCredits = availableCredits >= requiredCredits;
  const selectedPreset = outputPresets.find((preset) => preset.id === outputPreset) ?? outputPresets[0];
  const selectedStyleData = useMemo(
    () => styles.find((style) => style.id === selectedStyle) ?? defaultStyle,
    [defaultStyle, selectedStyle, styles],
  );
  const styleControls = selectedStyleData?.controls ?? [];
  const isSampleReferenceStyle = selectedStyleData?.id === "style_sample_reference";
  const currentMeta = stepMeta[step];
  const heroAsset = assets[0];
  const outputPresetItems = outputPresets.map((preset) => ({
    value: preset.id,
    label: preset.label,
    badge: (
      <span className="text-[10px] font-medium text-ink-3" dir="ltr">
        {preset.ratio}
      </span>
    ),
  }));

  useEffect(() => {
    return () => {
      if (referenceUploadPreview) {
        URL.revokeObjectURL(referenceUploadPreview);
      }
    };
  }, [referenceUploadPreview]);

  function handleTopBarBack() {
    if (step === "style") {
      setStep("size");
      return;
    }

    if (step === "size") {
      setStep("assets");
      return;
    }

    router.push("/gallery");
  }

  function selectStyle(style: StyleOption) {
    setSelectedStyle(style.id);
    setStyleControlValues(getInitialStyleControlValues(style));
  }

  function selectReference(reference: BatchStyleReference) {
    const input = document.getElementById("batch-reference-file-input");
    if (input instanceof HTMLInputElement) {
      input.value = "";
    }
    setReferenceUploadPreview(null);
    setSelectedReference(reference);
  }

  function setStyleControlValue(key: string, value: string) {
    setStyleControlValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="relative isolate flex min-h-0 w-full flex-1 flex-col bg-ink-1 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(212,184,134,0.10),transparent_55%)]"
      />
      <form action={action} className="relative flex min-h-0 w-full flex-1 flex-col gap-3 px-[var(--page-x)] pt-1">
        <AppTopBar
          title={topBarTitles[step]}
          onBack={handleTopBarBack}
          logoVariant="mark-light"
          tone="dark"
          className="-mx-[var(--page-x)] mb-0 min-h-12 px-[var(--page-x)]"
        />

        {assets.map((asset) => (
          <input key={asset.id} type="hidden" name="assetIds" value={asset.id} />
        ))}
        <input type="hidden" name="outputPreset" value={outputPreset} />
        {styleControls.map((control) => (
          <input key={control.key} type="hidden" name={`styleControl_${control.key}`} value={styleControlValues[control.key] ?? getControlDefaultValue(control)} />
        ))}
        {selectedReference ? <input type="hidden" name="referenceAssetId" value={selectedReference.id} /> : null}
        <input
          id="batch-reference-file-input"
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

        <header className="-mt-2 space-y-3">
          <div className="flex items-center justify-center">
            <Pill tone="champagne" className="w-fit">
              {currentMeta.stepNumber}
            </Pill>
          </div>
          <div className="flex items-center justify-center gap-2" aria-label="مراحل ساخت گروهی">
            {(["assets", "size", "style"] as WizardStep[]).map((item, index) => {
              const isActive = step === item;
              const isDone = ["assets", "size", "style"].indexOf(step) > index;

              return (
                <span
                  key={item}
                  className={`h-1.5 rounded-full transition ${
                    isActive ? "w-9 bg-champagne-500" : isDone ? "w-6 bg-champagne-300" : "w-5 bg-border-strong"
                  }`}
                />
              );
            })}
          </div>
        </header>

        {step === "assets" ? (
          <StepScrollPanel>
            <div className="grid grid-cols-4 gap-3">
              {assets.map((asset) => (
                <ImageFrame key={asset.id} aspect="square" tone="muted" className="rounded-[1rem]">
                  <SafeJewelryImage
                    src={asset.fileUrl}
                    fallbackSrc={uploadPreview.src}
                    fallbackAlt={uploadPreview.alt}
                    alt={assetTitle(asset)}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </ImageFrame>
              ))}
            </div>

            <section className="grid grid-cols-3 gap-3 rounded-[var(--r-lg)] border border-white/10 bg-white/5 px-4 py-4">
              <div>
                <p className="text-[11px] text-white/60">عکس‌ها</p>
                <p className="mt-1 text-sm font-semibold text-white">{requiredCredits.toLocaleString("fa-IR")}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60">اعتبار لازم</p>
                <p className="mt-1 text-sm font-semibold text-white">{requiredCredits.toLocaleString("fa-IR")}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/60">اعتبار شما</p>
                <p className="mt-1 text-sm font-semibold text-white">{availableCredits.toLocaleString("fa-IR")}</p>
              </div>
            </section>

            <section className="space-y-2">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center gap-3 rounded-[var(--r-lg)] border border-white/10 bg-white/5 px-3 py-2">
                  <ImageFrame aspect="square" tone="muted" className="h-11 w-11 shrink-0 rounded-[0.8rem]">
                    <SafeJewelryImage
                      src={asset.fileUrl}
                      fallbackSrc={uploadPreview.src}
                      fallbackAlt={uploadPreview.alt}
                      alt={assetTitle(asset)}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </ImageFrame>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{assetTitle(asset)}</p>
                    <div className="relative mt-1">
                      <select
                        name={`productType_${asset.id}`}
                        value={normalizeProductType(productTypes[asset.id] ?? DEFAULT_PRODUCT_TYPE)}
                        onChange={(event) =>
                          setProductTypes((current) => ({ ...current, [asset.id]: event.target.value }))
                        }
                        aria-label={`نوع محصول ${assetTitle(asset)}`}
                        className="min-h-8 w-full appearance-none rounded-full border border-white/10 bg-white/5 py-0 pr-3 pl-8 text-xs font-semibold text-white outline-none transition focus:border-champagne-500"
                      >
                        {PRODUCT_TYPES.map((item) => (
                          <option key={item} value={item} className="bg-ink-1 text-white">
                            {productTypeLabel(item)}
                          </option>
                        ))}
                      </select>
                      <ChevronsDown aria-hidden={true} className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/60" />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <ActionDock tone="dark" columns={2}>
              <Button type="button" variant="secondary" className="h-12 w-full" onClick={() => router.push("/gallery")}>
                تغییر عکس‌ها
              </Button>
              <Button type="button" variant="champagne" className="h-12 w-full" onClick={() => setStep("size")}>
                ادامه
                <ChevronLeft aria-hidden={true} className="h-4 w-4" />
              </Button>
            </ActionDock>
          </StepScrollPanel>
        ) : null}

        {step === "size" ? (
          <StepScrollPanel>
            <ImageFrame
              aspect="portrait"
              tone="dark"
              className="flex h-[min(288px,34svh)] min-h-[224px] items-center justify-center rounded-[1.45rem]"
            >
              <Image
                src={heroAsset?.fileUrl || uploadPreview.src}
                alt={assetTitle(heroAsset)}
                fill
                priority
                unoptimized
                className="object-cover object-[46%_55%] opacity-64"
                sizes="(max-width: 768px) 100vw, 760px"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,253,249,0.10)_0%,rgba(17,16,14,0.20)_54%,rgba(17,16,14,0.58)_100%)]" />
              <div className="absolute inset-0 flex items-center justify-center p-5">
                <div className={`rounded-[1.25rem] border border-white/55 bg-white/10 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.72)] backdrop-blur-sm ${selectedPreset.previewFrameClassName}`} />
              </div>
            </ImageFrame>

            <fieldset className="space-y-3">
              <legend className="sr-only">انتخاب ابعاد خروجی</legend>
              <SegmentedControl
                items={outputPresetItems}
                value={outputPreset}
                onChange={setOutputPreset}
                label="انتخاب ابعاد خروجی"
              />
            </fieldset>

            <ActionDock tone="dark" columns={2}>
              <Button type="button" variant="secondary" className="h-12 w-full" onClick={() => setStep("assets")}>
                بازگشت
              </Button>
              <Button type="button" variant="champagne" className="h-12 w-full" onClick={() => setStep("style")}>
                ادامه
                <ChevronLeft aria-hidden={true} className="h-4 w-4" />
              </Button>
            </ActionDock>
          </StepScrollPanel>
        ) : null}

        {step === "style" ? (
          <StepScrollPanel>
            <div className="grid grid-cols-3 gap-2">
              {styles.map((style) => {
                const checked = selectedStyle === style.id;

                return (
                  <label
                    key={style.id}
                    className={`relative overflow-hidden rounded-[var(--r-lg)] border transition ${
                      checked ? "border-champagne-500 bg-white/5 ring-1 ring-champagne-500/40" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="styleId"
                      value={style.id}
                      checked={checked}
                      onChange={() => selectStyle(style)}
                      className="sr-only"
                    />
                    <ImageFrame aspect="square" tone="muted" className="rounded-none border-0 bg-transparent shadow-none">
                      <Image
                        src={style.previewImageUrl}
                        alt={style.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 24vw, 140px"
                      />
                    </ImageFrame>
                    <div className="px-2 py-1.5">
                      <p className={`truncate text-[10px] font-semibold leading-4 ${checked ? "text-champagne-300" : "text-white"}`}>{style.label}</p>
                    </div>
                    {checked ? (
                      <span className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-[var(--r-pill)] bg-champagne-500 text-champagne-ink">
                        <CheckCircle aria-hidden={true} className="h-3 w-3" />
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            {styleControls.length > 0 ? (
              <section className="space-y-3 rounded-[var(--r-lg)] border border-white/10 bg-white/5 px-4 py-4">
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
                        <span className="flex items-center justify-between gap-3 text-xs text-white/60">
                          <span>{control.label}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white" dir="ltr">
                            {value}
                          </span>
                        </span>
                        <input
                          type="range"
                          min={control.minValue ?? 0}
                          max={control.maxValue ?? 100}
                          value={value}
                          onChange={(event) => setStyleControlValue(control.key, event.target.value)}
                          className="w-full accent-champagne-500"
                        />
                      </label>
                    );
                  }

                  return (
                    <label key={control.key} className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--r-md)] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                      <span>{control.label}</span>
                      <input
                        type="checkbox"
                        checked={value === "true"}
                        onChange={(event) => setStyleControlValue(control.key, event.target.checked ? "true" : "false")}
                        className="h-4 w-4 accent-champagne-500"
                      />
                    </label>
                  );
                })}
              </section>
            ) : null}

            {isSampleReferenceStyle ? (
              <section className="space-y-3 rounded-[var(--r-lg)] border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-white/60">عکس نمونه مشترک</p>
                  <label htmlFor="batch-reference-file-input" className={buttonClasses({ variant: "secondary", className: "min-h-9 rounded-full px-3 text-xs" })}>
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
                          <ImageFrame aspect="square" selected={checked} tone="muted" className="rounded-[var(--r-lg)]">
                            <SafeJewelryImage
                              src={reference.fileUrl}
                              fallbackSrc={uploadPreview.src}
                              fallbackAlt={uploadPreview.alt}
                              alt={title}
                              fill
                              className="object-cover"
                              sizes="120px"
                            />
                            {checked ? (
                              <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-[var(--r-pill)] bg-champagne-500 text-champagne-ink">
                                <CheckCircle aria-hidden={true} className="h-3.5 w-3.5" />
                              </span>
                            ) : null}
                          </ImageFrame>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {referenceUploadPreview ? (
                  <div className="flex items-center gap-3 rounded-[var(--r-md)] border border-white/10 bg-white/5 px-3 py-2">
                    <ImageFrame aspect="square" selected tone="muted" className="h-16 w-16 shrink-0 rounded-[var(--r-md)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={referenceUploadPreview} alt="پیش‌نمایش عکس نمونه" className="h-full w-full object-cover" />
                    </ImageFrame>
                    <div className="flex min-w-0 items-center gap-2 text-xs text-white/75">
                      <ImageIcon aria-hidden={true} className="h-4 w-4 shrink-0 text-champagne-300" />
                      <span>نمونه آپلودی</span>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!hasEnoughCredits || error ? (
              <div className="rounded-[var(--r-lg)] border border-danger/30 bg-danger/8 px-3 py-3 text-danger">
                <p className="text-sm font-semibold">اعتبار کافی نیست</p>
                <p className="mt-1 text-[12px] leading-6 text-danger/90">
                  {error || "برای این تعداد عکس اعتبار آزاد کافی ندارید."}
                </p>
              </div>
            ) : null}

            <ActionDock tone="dark" columns={2}>
              <Button type="button" variant="secondary" className="h-12 w-full" onClick={() => setStep("size")}>
                بازگشت
              </Button>
              {hasEnoughCredits ? (
                <Button type="submit" disabled={!selectedStyleData || (isSampleReferenceStyle && !selectedReference && !referenceUploadPreview)} variant="champagne" className="h-12 w-full">
                  شروع گروهی
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-champagne-500/30 bg-champagne-500/15 px-2 text-[11px] font-bold text-champagne-200" aria-label={`${requiredCredits.toLocaleString("fa-IR")} اعتبار`}>
                    {requiredCredits.toLocaleString("fa-IR")}
                  </span>
                  <Wand2 aria-hidden={true} className="h-4 w-4" />
                </Button>
              ) : (
                <ButtonLink href="/billing" variant="champagne" className="h-12 w-full">
                  خرید اعتبار
                  <ChevronLeft aria-hidden={true} className="h-4 w-4" />
                </ButtonLink>
              )}
            </ActionDock>
          </StepScrollPanel>
        ) : null}
      </form>
    </div>
  );
}
