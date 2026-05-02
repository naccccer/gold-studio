"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, Images, Info, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
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
};

type OutputPresetId = "post" | "story" | "banner";
type SourceMode = "upload" | "gallery";

const outputPresets: Array<{
  id: OutputPresetId;
  label: string;
  ratio: string;
  className: string;
}> = [
  { id: "post", label: "پست", ratio: "۱:۱", className: "aspect-square" },
  { id: "story", label: "استوری", ratio: "۹:۱۶", className: "aspect-[9/16]" },
  { id: "banner", label: "بنر", ratio: "۱۶:۹", className: "aspect-[16/9]" },
];

function presetFrameClass(presetId: OutputPresetId) {
  return outputPresets.find((preset) => preset.id === presetId)?.className ?? "aspect-square";
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

function HelpSheet({
  title,
  children,
  open,
  onClose,
}: {
  title: string;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/28 px-3 pb-3 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-sm rounded-[1.35rem] border border-border bg-surface p-4 shadow-[0_30px_70px_-44px_rgba(23,20,17,0.9)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-soft" aria-label="بستن">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 text-sm leading-7 text-muted">{children}</div>
      </div>
    </div>
  );
}

export function NewProjectForm({
  action,
  galleryAssets,
  selectedAssetId,
  styles,
}: NewProjectFormProps) {
  const initiallySelectedAsset = galleryAssets.find((asset) => asset.id === selectedAssetId) ?? null;
  const defaultStyle = styles[0];
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [step, setStep] = useState<"upload" | "style">(initiallySelectedAsset ? "style" : "upload");
  const [sourceMode, setSourceMode] = useState<SourceMode>(initiallySelectedAsset ? "gallery" : "upload");
  const [selectedAsset, setSelectedAsset] = useState<GalleryAssetOption | null>(initiallySelectedAsset);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputPreset, setOutputPreset] = useState<OutputPresetId>("post");
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle?.id ?? "");
  const [modelGender, setModelGender] = useState("woman");
  const [modesty, setModesty] = useState("65");
  const [help, setHelp] = useState<"frame" | "style" | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectedStyleData = useMemo(
    () => styles.find((preset) => preset.id === selectedStyle) ?? defaultStyle,
    [defaultStyle, selectedStyle, styles],
  );
  const modelControls = selectedStyleData?.controls ?? [];
  const genderControl = modelControls.find((control) => control.key === "modelGender");
  const modestyControl = modelControls.find((control) => control.key === "modesty");
  const genderOptions = parseChoiceOptions(genderControl?.optionsJson);
  const showModelControls = Boolean(genderControl || modestyControl);
  const frameClass = presetFrameClass(outputPreset);
  const currentImageSrc = sourceMode === "gallery" ? selectedAsset?.fileUrl : previewUrl;
  const canContinue = sourceMode === "gallery" ? Boolean(selectedAsset) : Boolean(previewUrl);

  function selectStyle(style: StyleOption) {
    const nextGenderControl = style.controls?.find((control) => control.key === "modelGender");
    const nextModestyControl = style.controls?.find((control) => control.key === "modesty");

    setSelectedStyle(style.id);
    setModelGender(nextGenderControl?.defaultValue ?? "woman");
    setModesty(nextModestyControl?.defaultValue ?? "65");
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="generationMode" value="image" />
      <input type="hidden" name="outputPreset" value={outputPreset} />
      <input type="hidden" name="modelGender" value={modelGender} />
      <input type="hidden" name="modesty" value={modesty} />
      {selectedAsset ? <input type="hidden" name="sourceAssetId" value={selectedAsset.id} /> : null}
      <input
        required={sourceMode === "upload" && !selectedAsset}
        id="image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setPreviewUrl((currentPreview) => {
            if (currentPreview) URL.revokeObjectURL(currentPreview);
            return file ? URL.createObjectURL(file) : null;
          });
        }}
      />

      <div className="grid grid-cols-2 gap-1 rounded-full border border-border/70 bg-surface p-1 text-[11px] text-muted">
        <button
          type="button"
          onClick={() => setStep("upload")}
          className={step === "upload" ? "rounded-full bg-surface-soft px-3 py-2 font-medium text-foreground" : "px-3 py-2"}
        >
          ۱. تصویر
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => setStep("style")}
          className={step === "style" ? "rounded-full bg-surface-soft px-3 py-2 font-medium text-foreground" : "px-3 py-2 disabled:opacity-45"}
        >
          ۲. سبک
        </button>
      </div>

      {step === "upload" ? (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-1 text-sm">
            <button
              type="button"
              onClick={() => setSourceMode("upload")}
              className={`h-10 rounded-[var(--radius-sm)] ${sourceMode === "upload" ? "bg-surface-soft font-medium text-foreground" : "text-muted"}`}
            >
              آپلود
            </button>
            <button
              type="button"
              onClick={() => setSourceMode("gallery")}
              className={`h-10 rounded-[var(--radius-sm)] ${sourceMode === "gallery" ? "bg-surface-soft font-medium text-foreground" : "text-muted"}`}
            >
              گالری
            </button>
          </div>

          {sourceMode === "upload" ? (
            <>
              <label htmlFor="image" className="group block cursor-pointer">
                <JewelryImageFrame aspect="square" className={`${frameClass} bg-surface-soft shadow-none transition group-hover:border-border-strong`}>
                  {previewUrl ? (
                    <Image src={previewUrl} alt="پیش‌نمایش تصویر محصول" fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
                  ) : (
                    <Image src={uploadPreview.src} alt={uploadPreview.alt} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/58 via-black/18 to-transparent p-4">
                    <div className="flex items-end justify-between gap-3 text-surface">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-xs font-medium">
                        <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                        {previewUrl ? "جایگزینی" : "انتخاب تصویر"}
                      </span>
                      <span className="text-[11px] font-medium text-surface/80">JPG / PNG / WEBP</span>
                    </div>
                  </div>
                </JewelryImageFrame>
              </label>

            </>
          ) : (
            <section className="space-y-3">
              {galleryAssets.length === 0 ? (
                <div className="rounded-[1rem] border border-border/70 bg-surface px-4 py-4 text-center">
                  <Images aria-hidden="true" className="mx-auto h-5 w-5 text-muted" />
                  <p className="mt-2 text-sm text-muted">گالری خالی است.</p>
                  <Link href="/gallery" className="mt-3 inline-flex text-sm font-medium text-foreground underline underline-offset-4">
                    افزودن تصویر
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {galleryAssets.map((asset) => {
                    const selected = selectedAsset?.id === asset.id;
                    const label = asset.title || asset.originalName || "تصویر محصول";
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => setSelectedAsset(asset)}
                        className={`relative overflow-hidden rounded-[var(--radius-md)] border bg-surface-soft ${selected ? "border-border-strong" : "border-border/60"}`}
                        aria-label={label}
                      >
                        <span className="relative block aspect-square">
                          <Image src={asset.fileUrl} alt={label} fill className="object-cover" sizes="33vw" />
                        </span>
                        {selected ? (
                          <span className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                            <Check aria-hidden="true" className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">کادر خروجی</h2>
              <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-muted" aria-label="راهنمای کادر خروجی" onClick={() => setHelp("frame")}>
                <Info aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {outputPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setOutputPreset(preset.id)}
                  className={`rounded-[var(--radius-md)] border px-3 py-3 text-center transition ${
                    outputPreset === preset.id ? "border-border-strong bg-surface text-foreground" : "border-border/70 bg-surface/55 text-muted"
                  }`}
                >
                  <span className="block text-sm font-medium">{preset.label}</span>
                  <span className="mt-1 block text-[10px] text-muted/70" dir="ltr">
                    {preset.ratio}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <Button type="button" disabled={!canContinue} size="full" className="h-12" onClick={() => setStep("style")}>
            ادامه
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </Button>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center gap-3 rounded-[1rem] border border-border/70 bg-surface px-3 py-3">
            <div className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-[0.8rem] border border-border bg-surface-soft ${frameClass}`}>
              <Image src={currentImageSrc || uploadPreview.src} alt="تصویر انتخاب‌شده" fill className="object-cover" sizes="72px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{selectedStyleData?.label ?? "انتخاب سبک"}</p>
              <p className="truncate text-[11px] text-muted">{outputPresets.find((preset) => preset.id === outputPreset)?.label}</p>
            </div>
            <button type="button" onClick={() => setHelp("style")} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted" aria-label="راهنمای انتخاب سبک">
              <Info aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>

          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="sr-only">انتخاب سبک خروجی</legend>
            {styles.map((preset) => {
              const checked = selectedStyle === preset.id;

              return (
                <label key={preset.id} className={`group cursor-pointer overflow-hidden rounded-[1rem] border bg-surface transition ${checked ? "border-border-strong shadow-[var(--shadow-soft)]" : "border-border/60"}`}>
                  <input type="radio" name="styleId" value={preset.id} checked={checked} onChange={() => selectStyle(preset)} className="sr-only" />
                  <JewelryImageFrame aspect="square" className="rounded-none border-0 bg-surface-soft shadow-none">
                    <Image src={preset.previewImageUrl} alt={preset.label} fill className="object-cover" sizes="(max-width: 768px) 45vw, 220px" />
                    {checked ? (
                      <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                        <Check aria-hidden="true" className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </JewelryImageFrame>
                  <p className="truncate px-3 py-2 text-sm font-semibold text-foreground">{preset.label}</p>
                </label>
              );
            })}
          </fieldset>

          {selectedStyleData ? (
            <section className="space-y-3 rounded-[1rem] border border-border/70 bg-surface px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{selectedStyleData.label}</h2>
                  <p className="mt-1 text-xs leading-6 text-muted">{selectedStyleData.description}</p>
                </div>
                <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[10px] text-muted">انتخاب‌شده</span>
              </div>

              {showModelControls ? (
                <div className="space-y-3 border-t border-border/60 pt-3">
                  {genderOptions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {genderOptions.map((item) => (
                        <button key={item.value} type="button" onClick={() => setModelGender(item.value)} className={`h-10 rounded-[var(--radius-md)] border text-sm transition ${modelGender === item.value ? "border-border-strong bg-surface-soft text-foreground" : "border-border/70 text-muted"}`}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {modestyControl ? (
                    <label className="block space-y-2">
                      <span className="text-xs text-muted">{modestyControl.label}</span>
                      <input type="range" min={modestyControl.minValue ?? 35} max={modestyControl.maxValue ?? 90} value={modesty} onChange={(event) => setModesty(event.target.value)} className="w-full accent-[#c89f61]" />
                    </label>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {state.error ? (
            <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending || !selectedStyleData} size="full" className="h-12">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            {pending ? "در حال تولید..." : "تولید"}
          </Button>
        </section>
      )}

      <HelpSheet title="کادر خروجی" open={help === "frame"} onClose={() => setHelp(null)}>
        پست برای مربع، استوری برای نمایش عمودی و بنر برای تصویر افقی مناسب است. بعدا می‌توانید این انتخاب را دقیق‌تر کنید.
      </HelpSheet>
      <HelpSheet title="انتخاب سبک" open={help === "style"} onClose={() => setHelp(null)}>
        سبک فقط جهت هنری تصویر را تعیین می‌کند. توضیح کوتاه و کنترل‌های اضافه فقط برای سبک انتخاب‌شده نمایش داده می‌شود.
      </HelpSheet>
    </form>
  );
}
