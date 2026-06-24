"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown2, ArrowLeft, DocumentUpload, Image as ImageIcon, Magicpen, TickCircle } from "vuesax-icons-react";
import { ActionDock } from "@/components/ui/action-dock";
import { AppTopBar } from "@/components/ui/app-top-bar";
import { Button, ButtonLink } from "@/components/ui/button";
import { ImageOverlayPill, JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  StyleChoiceControl,
  StyleRangeControl,
  StyleSegmentedChoiceControl,
  StyleToggleControl,
} from "@/features/projects/components/style-choice-control";
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

export type BatchReadyStyleReference = {
  id: string;
  fileUrl: string;
  title: string;
  alt: string;
};

type GalleryBatchNewScreenProps = {
  assets: BatchSourceAsset[];
  readyStyleReferences: BatchReadyStyleReference[];
  styleReferences: BatchStyleReference[];
  styles: StyleOption[];
  availableCredits: number;
  requiredCredits: number;
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

function shouldShowStyleControl(control: StyleControl, values: Record<string, string>) {
  return control.key !== "fullHijab" || (values.modelGender ?? "woman") === "woman";
}

function getResolvedStyleControlValue(control: StyleControl, values: Record<string, string>) {
  if (control.key === "fullHijab" && !shouldShowStyleControl(control, values)) {
    return "false";
  }

  return values[control.key] ?? getControlDefaultValue(control);
}

export function GalleryBatchNewScreen({
  assets,
  readyStyleReferences,
  styleReferences,
  styles,
  availableCredits,
  requiredCredits,
  error,
  action,
}: GalleryBatchNewScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("assets");
  const [outputPreset, setOutputPreset] = useState<OutputPresetId>("post");
  const defaultStyle = styles[0];
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle?.id ?? "");
  const [selectedReference, setSelectedReference] = useState<BatchStyleReference | null>(null);
  const [selectedReadySampleId, setSelectedReadySampleId] = useState<string | null>(null);
  const [referenceUploadPreview, setReferenceUploadPreview] = useState<string | null>(null);
  const [styleControlValues, setStyleControlValues] = useState<Record<string, string>>(() => getInitialStyleControlValues(defaultStyle));
  const [openStyleControl, setOpenStyleControl] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<Record<string, string>>(() =>
    Object.fromEntries(assets.map((asset) => [asset.id, normalizeProductType(asset.productType)])),
  );
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
      <span className="text-[10px] font-medium text-muted" dir="ltr">
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
    setOpenStyleControl(null);
  }

  function selectReference(reference: BatchStyleReference) {
    const input = document.getElementById("batch-reference-file-input");
    if (input instanceof HTMLInputElement) {
      input.value = "";
    }
    setReferenceUploadPreview(null);
    setSelectedReadySampleId(null);
    setSelectedReference(reference);
  }

  function selectReadyReference(reference: BatchReadyStyleReference) {
    const input = document.getElementById("batch-reference-file-input");
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

  return (
    <PageShell maxWidth="lg" minHeight={false} className="flex-1 overflow-hidden pb-0">
      <form action={action} className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
        <AppTopBar
          title={topBarTitles[step]}
          onBack={handleTopBarBack}
          logoVariant="mark-light"
          tone="dark"
          className="mb-0 min-h-12 px-0"
        />

        {assets.map((asset) => (
          <input key={asset.id} type="hidden" name="assetIds" value={asset.id} />
        ))}
        <input type="hidden" name="outputPreset" value={outputPreset} />
        {styleControls.map((control) => (
          <input key={control.key} type="hidden" name={`styleControl_${control.key}`} value={getResolvedStyleControlValue(control, styleControlValues)} />
        ))}
        {selectedReference ? <input type="hidden" name="referenceAssetId" value={selectedReference.id} /> : null}
        {selectedReadySampleId ? <input type="hidden" name="readySampleId" value={selectedReadySampleId} /> : null}
        <input
          id="batch-reference-file-input"
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

        <header className="-mt-2 space-y-3">
          <div className="flex items-center justify-center">
            <ImageOverlayPill tone="accent" className="w-fit">
              {currentMeta.stepNumber}
            </ImageOverlayPill>
          </div>
          <div className="flex items-center justify-center gap-2" aria-label="مراحل ساخت گروهی">
            {(["assets", "size", "style"] as WizardStep[]).map((item, index) => {
              const isActive = step === item;
              const isDone = ["assets", "size", "style"].indexOf(step) > index;

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

        {step === "assets" ? (
          <StepScrollPanel>
            <div className="grid grid-cols-4 gap-3">
              {assets.map((asset) => (
                <JewelryImageFrame key={asset.id} aspect="square" treatment="quiet" className="rounded-[1rem]">
                  <SafeJewelryImage
                    src={asset.fileUrl}
                    fallbackSrc={uploadPreview.src}
                    fallbackAlt={uploadPreview.alt}
                    alt={assetTitle(asset)}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </JewelryImageFrame>
              ))}
            </div>

            <section className="grid grid-cols-3 gap-3 rounded-[1rem] border border-white/12 bg-white/[0.06] px-3 py-3">
              <div>
                <p className="text-[11px] text-surface/60">عکس‌ها</p>
                <p className="mt-1 text-sm font-semibold text-surface">{requiredCredits.toLocaleString("fa-IR")}</p>
              </div>
              <div>
                <p className="text-[11px] text-surface/60">اعتبار لازم</p>
                <p className="mt-1 text-sm font-semibold text-surface">{requiredCredits.toLocaleString("fa-IR")}</p>
              </div>
              <div>
                <p className="text-[11px] text-surface/60">اعتبار شما</p>
                <p className="mt-1 text-sm font-semibold text-surface">{availableCredits.toLocaleString("fa-IR")}</p>
              </div>
            </section>

            <section className="space-y-2">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center gap-3 rounded-[1rem] border border-white/12 bg-white/[0.04] px-3 py-2">
                  <JewelryImageFrame aspect="square" treatment="quiet" className="h-11 w-11 shrink-0 rounded-[0.8rem]">
                    <SafeJewelryImage
                      src={asset.fileUrl}
                      fallbackSrc={uploadPreview.src}
                      fallbackAlt={uploadPreview.alt}
                      alt={assetTitle(asset)}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </JewelryImageFrame>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-surface">{assetTitle(asset)}</p>
                    <div className="relative mt-1">
                      <select
                        name={`productType_${asset.id}`}
                        value={normalizeProductType(productTypes[asset.id] ?? DEFAULT_PRODUCT_TYPE)}
                        onChange={(event) =>
                          setProductTypes((current) => ({ ...current, [asset.id]: event.target.value }))
                        }
                        aria-label={`نوع محصول ${assetTitle(asset)}`}
                        className="min-h-8 w-full appearance-none rounded-full border border-white/12 bg-white/[0.08] py-0 pr-3 pl-8 text-xs font-semibold text-surface outline-none transition focus:border-white/28"
                      >
                        {PRODUCT_TYPES.map((item) => (
                          <option key={item} value={item} className="bg-[#171411] text-white">
                            {productTypeLabel(item)}
                          </option>
                        ))}
                      </select>
                      <ArrowDown2 aria-hidden={true} className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-surface/72" />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <ActionDock className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" columns={2}>
              <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={() => router.push("/gallery")}>
                تغییر عکس‌ها
              </Button>
              <Button type="button" variant="studio-primary" className="h-12 w-full" onClick={() => setStep("size")}>
                ادامه
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
            </JewelryImageFrame>

            <fieldset className="space-y-3">
              <legend className="sr-only">انتخاب ابعاد خروجی</legend>
              <SegmentedControl
                items={outputPresetItems}
                value={outputPreset}
                onChange={setOutputPreset}
                label="انتخاب ابعاد خروجی"
              />
            </fieldset>

            <ActionDock className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" columns={2}>
              <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={() => setStep("assets")}>
                بازگشت
              </Button>
              <Button type="button" variant="studio-primary" className="h-12 w-full" onClick={() => setStep("style")}>
                ادامه
                <ArrowLeft aria-hidden={true} className="h-4 w-4" />
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
                    className={`relative overflow-hidden rounded-[1rem] border transition ${
                      checked ? "border-accent-bright bg-surface/12 ring-1 ring-accent-bright/45" : "border-white/12 bg-white/[0.04]"
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
                    <JewelryImageFrame aspect="square" treatment="quiet" className="rounded-none border-0 bg-transparent shadow-none">
                      <Image
                        src={style.previewImageUrl}
                        alt={style.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 24vw, 140px"
                      />
                    </JewelryImageFrame>
                    <div className="px-2 py-1.5">
                      <p className="truncate text-[10px] font-semibold leading-4 text-surface">{style.label}</p>
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
                  <p className="text-xs font-medium text-surface/72">عکس نمونه مشترک</p>
                  <label htmlFor="batch-reference-file-input" className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/14 bg-white/[0.06] px-3 text-xs font-semibold text-surface">
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
                              fallbackSrc={uploadPreview.src}
                              fallbackAlt={uploadPreview.alt}
                              alt={reference.alt}
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
                              fallbackSrc={uploadPreview.src}
                              fallbackAlt={uploadPreview.alt}
                              alt={title}
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

            {!hasEnoughCredits || error ? (
              <div className="rounded-[1rem] border border-danger/24 bg-danger-soft/92 px-3 py-3 text-danger shadow-[0_18px_32px_-26px_rgba(152,59,52,0.42)]">
                <p className="text-sm font-semibold">اعتبار کافی نیست</p>
                <p className="mt-1 text-[12px] leading-6 text-danger/88">
                  {error || "برای این تعداد عکس اعتبار آزاد کافی ندارید."}
                </p>
              </div>
            ) : null}

            <ActionDock className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" columns={2}>
              <Button type="button" variant="studio-secondary" className="h-12 w-full" onClick={() => setStep("size")}>
                بازگشت
              </Button>
              {hasEnoughCredits ? (
                <Button type="submit" disabled={!selectedStyleData || (isSampleReferenceStyle && !selectedReference && !selectedReadySampleId && !referenceUploadPreview)} variant="studio-primary" className="h-12 w-full">
                  شروع گروهی
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-studio-control/15 bg-studio-control/12 px-2 text-[11px] font-bold text-studio-control" aria-label={`${requiredCredits.toLocaleString("fa-IR")} اعتبار`}>
                    {requiredCredits.toLocaleString("fa-IR")}
                  </span>
                  <Magicpen aria-hidden={true} className="h-4 w-4" />
                </Button>
              ) : (
                <ButtonLink href="/billing" variant="studio-primary" className="h-12 w-full">
                  خرید اعتبار
                  <ArrowLeft aria-hidden={true} className="h-4 w-4" />
                </ButtonLink>
              )}
            </ActionDock>
          </StepScrollPanel>
        ) : null}
      </form>
    </PageShell>
  );
}
