"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, Check, Images, Sparkles, Upload } from "lucide-react";
import { ActionDock } from "@/components/ui/action-dock";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
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
}> = [
  { id: "post", label: "پست", ratio: "۱:۱", className: "aspect-square" },
  { id: "story", label: "استوری", ratio: "۹:۱۶", className: "aspect-[9/16]" },
  { id: "banner", label: "بنر", ratio: "۱۶:۹", className: "aspect-video" },
];

const darkPrimaryActionClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[1rem] border border-[#ffd98f]/45 bg-[linear-gradient(135deg,#f8df9f_0%,#d8a552_48%,#9a672a_100%)] text-sm font-semibold !text-[#140f0a] shadow-[0_18px_38px_-24px_rgba(216,165,82,0.9)] transition hover:brightness-105 disabled:opacity-60";
const darkSecondaryActionClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[1rem] border border-white/28 bg-white/[0.08] text-sm font-semibold !text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/42 hover:bg-white/[0.12] disabled:opacity-60";

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
  const explicitSelectedAsset = selectedAssetId ? galleryAssets.find((asset) => asset.id === selectedAssetId) ?? null : null;
  const initiallySelectedAsset = explicitSelectedAsset ?? galleryAssets[0] ?? null;
  const defaultStyle = styles[0];
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [step, setStep] = useState<WizardStep>(explicitSelectedAsset ? "size" : "source");
  const [selectedAsset, setSelectedAsset] = useState<GalleryAssetOption | null>(initiallySelectedAsset);
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
  const modelControls = selectedStyleData?.controls ?? [];
  const genderControl = modelControls.find((control) => control.key === "modelGender");
  const modestyControl = modelControls.find((control) => control.key === "modesty");
  const genderOptions = parseChoiceOptions(genderControl?.optionsJson);

  const currentImageSrc = selectedAsset?.fileUrl ?? previewUrl;
  const hasSource = Boolean(currentImageSrc);
  const canSubmit = Boolean(selectedStyleData) && hasSource;

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

  function selectStyle(style: StyleOption) {
    const nextGenderControl = style.controls?.find((control) => control.key === "modelGender");
    const nextModestyControl = style.controls?.find((control) => control.key === "modesty");

    setSelectedStyle(style.id);
    setModelGender(nextGenderControl?.defaultValue ?? "woman");
    setModesty(nextModestyControl?.defaultValue ?? "65");
  }

  return (
    <form action={formAction} className="flex min-h-[calc(100svh-12rem)] flex-col gap-4">
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

      <div className="flex items-center justify-center gap-2" aria-label="مراحل پروژه">
        {(["source", "size", "style"] as WizardStep[]).map((item) => (
          <span
            key={item}
            className={`h-1.5 rounded-full transition ${step === item ? "w-8 bg-accent" : "w-5 bg-accent/28"}`}
          />
        ))}
      </div>

      {step === "source" ? (
        <section className="space-y-4">
          <label
            htmlFor="project-file-input"
            className="relative block h-[330px] cursor-pointer overflow-hidden rounded-[1.45rem] border border-white/80 bg-[#e7ded2]"
          >
            <Image
              src={currentImageSrc || uploadPreview.src}
              alt="تصویر انتخاب‌شده"
              fill
              priority
              className="object-cover object-[46%_55%]"
              sizes="(max-width: 768px) 100vw, 760px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/54 to-transparent p-3">
              <p className="w-fit rounded-full bg-surface/88 px-3 py-1 text-xs font-medium text-[#554d43] backdrop-blur">
                عکس محصول
              </p>
            </div>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label
              htmlFor="project-camera-input"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-[1rem] bg-foreground text-xs font-semibold text-surface"
            >
              <Camera aria-hidden={true} className="h-4 w-4" />
              دوربین
            </label>
            <label
              htmlFor="project-file-input"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-[1rem] border border-border bg-surface text-xs font-semibold text-foreground"
            >
              <Upload aria-hidden={true} className="h-4 w-4" />
              آپلود
            </label>
            <Link
              href="/gallery"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-[1rem] border border-border bg-surface text-xs font-semibold text-foreground"
            >
              <Images aria-hidden={true} className="h-4 w-4" />
              گالری
            </Link>
          </div>
          <ActionDock sticky fade={false} columns={hasSource ? 2 : 1}>
            {hasSource ? (
            <button type="button" className={darkSecondaryActionClass} onClick={() => setSelectedAsset(null)}>
              تغییر عکس
            </button>
          ) : null}
            <button type="button" className={darkPrimaryActionClass} onClick={() => setStep("size")} disabled={!hasSource}>
              ادامه
              <ArrowLeft aria-hidden={true} className="h-4 w-4" />
            </button>
          </ActionDock>
        </section>
      ) : null}

      {step === "size" ? (
        <section className="flex flex-1 flex-col gap-4">
          <div className="relative h-[214px] overflow-hidden rounded-[1.25rem] border border-white/80 bg-[#e7ded2]">
            {selectedAsset ? (
              <SafeJewelryImage
                src={selectedAsset.fileUrl}
                alt={selectedAsset.title || selectedAsset.originalName || "تصویر محصول"}
                fallbackSrc={uploadPreview.src}
                fallbackAlt={uploadPreview.alt}
                fill
                priority
                className="object-cover object-[46%_55%]"
                sizes="(max-width: 768px) 100vw, 760px"
              />
            ) : (
              <Image
                src={currentImageSrc || uploadPreview.src}
                alt="تصویر انتخاب‌شده"
                fill
                priority
                className="object-cover object-[46%_55%]"
                sizes="(max-width: 768px) 100vw, 760px"
              />
            )}
          </div>

          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="sr-only">انتخاب سایز خروجی</legend>
            {outputPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setOutputPreset(preset.id)}
                className={`rounded-[1rem] border p-2 transition ${
                  outputPreset === preset.id ? "border-[#c7a96b] bg-surface" : "border-white/72 bg-surface/58"
                }`}
              >
                <span className={`mx-auto block w-full rounded-[0.55rem] bg-[#1b1814] ${preset.className}`} />
                <span className="mt-2 block text-xs font-semibold text-foreground">{preset.label}</span>
                <span className="mt-0.5 block text-[10px] text-muted" dir="ltr">
                  {preset.ratio}
                </span>
              </button>
            ))}
          </fieldset>

          <ActionDock className="mt-auto" columns={2}>
            <button type="button" className={darkSecondaryActionClass} onClick={() => setStep("source")}>
              برگشت
            </button>
            <button type="button" className={darkPrimaryActionClass} onClick={() => setStep("style")} disabled={!hasSource}>
              ادامه
              <ArrowLeft aria-hidden={true} className="h-4 w-4" />
            </button>
          </ActionDock>
        </section>
      ) : null}

      {step === "style" ? (
        <section className="flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {styles.map((preset) => {
              const checked = selectedStyle === preset.id;
              return (
                <label
                  key={preset.id}
                  className={`relative overflow-hidden rounded-[0.9rem] border bg-white/60 ${
                    checked ? "border-[#c7a96b]" : "border-white/72"
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
                  <JewelryImageFrame aspect="square" className="rounded-none border-0 bg-surface-soft shadow-none">
                    <Image
                      src={preset.previewImageUrl}
                      alt={preset.label}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 30vw, 180px"
                    />
                  </JewelryImageFrame>
                  <p className="truncate px-2 py-1.5 text-[10px] font-medium leading-5 text-foreground">{preset.label}</p>
                  {checked ? (
                    <span className="absolute left-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                      <Check aria-hidden={true} className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>

          {genderOptions.length > 0 || modestyControl ? (
            <section className="space-y-3 rounded-[1rem] border border-border/70 bg-surface px-3 py-3">
              {genderOptions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setModelGender(item.value)}
                      className={`h-10 rounded-[var(--radius-md)] border text-sm transition ${
                        modelGender === item.value
                          ? "border-border-strong bg-surface-soft text-foreground"
                          : "border-border/70 text-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {modestyControl ? (
                <label className="block space-y-2">
                  <span className="text-xs text-muted">{modestyControl.label}</span>
                  <input
                    type="range"
                    min={modestyControl.minValue ?? 35}
                    max={modestyControl.maxValue ?? 90}
                    value={modesty}
                    onChange={(event) => setModesty(event.target.value)}
                    className="w-full accent-[#c89f61]"
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
            <button type="button" className={darkSecondaryActionClass} onClick={() => setStep("size")}>
              {selectedPreset.label}
            </button>
            <button type="submit" disabled={pending || !canSubmit} className={darkPrimaryActionClass}>
              {pending ? "در حال ساخت..." : "ساخت تصویر"}
              <Sparkles aria-hidden={true} className="h-4 w-4" />
            </button>
          </ActionDock>
        </section>
      ) : null}
    </form>
  );
}
