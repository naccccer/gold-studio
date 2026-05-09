"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Images, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

type OutputPresetId = "post" | "story" | "banner";
type SourceMode = "upload" | "gallery";

const outputPresets: Array<{
  id: OutputPresetId;
  label: string;
  ratio: string;
}> = [
  { id: "post", label: "پست", ratio: "۱:۱" },
  { id: "story", label: "استوری", ratio: "۹:۱۶" },
  { id: "banner", label: "بنر", ratio: "۱۶:۹" },
];

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
}: NewProjectFormProps) {
  const initiallySelectedAsset =
    galleryAssets.find((asset) => asset.id === selectedAssetId) ?? galleryAssets[0] ?? null;
  const defaultStyle = styles[0];
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [sourceMode, setSourceMode] = useState<SourceMode>(initiallySelectedAsset ? "gallery" : "upload");
  const [selectedAsset, setSelectedAsset] = useState<GalleryAssetOption | null>(initiallySelectedAsset);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputPreset, setOutputPreset] = useState<OutputPresetId>("post");
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

  const modelControls = selectedStyleData?.controls ?? [];
  const genderControl = modelControls.find((control) => control.key === "modelGender");
  const modestyControl = modelControls.find((control) => control.key === "modesty");
  const genderOptions = parseChoiceOptions(genderControl?.optionsJson);

  const currentImageSrc = sourceMode === "gallery" ? selectedAsset?.fileUrl : previewUrl;
  const canSubmit = Boolean(selectedStyleData) && (sourceMode === "gallery" ? Boolean(selectedAsset) : Boolean(previewUrl));

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
            if (currentPreview) {
              URL.revokeObjectURL(currentPreview);
            }
            return file ? URL.createObjectURL(file) : null;
          });
        }}
      />

      <section className="space-y-3">
        {sourceMode === "upload" ? (
          <label htmlFor="image" className="group block cursor-pointer">
            <div className="relative h-[218px] overflow-hidden rounded-[1.45rem] border border-white/80 bg-[#e7ded2]">
              <Image
                src={currentImageSrc || uploadPreview.src}
                alt="تصویر انتخاب‌شده"
                fill
                priority
                className="object-cover object-[46%_55%]"
                sizes="(max-width: 768px) 100vw, 760px"
              />
              <div className="absolute bottom-3 right-3 rounded-full bg-surface/86 px-3 py-1 text-xs font-medium text-[#554d43] backdrop-blur">
                {previewUrl ? "جایگزینی تصویر" : "عکس انتخاب‌شده"}
              </div>
              <span className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/55 bg-black/36 text-surface">
                <Upload aria-hidden={true} className="h-4 w-4" />
              </span>
            </div>
          </label>
        ) : galleryAssets.length === 0 ? (
          <div className="rounded-[1rem] border border-border/70 bg-surface px-4 py-4 text-center">
            <Images aria-hidden={true} className="mx-auto h-5 w-5 text-muted" />
            <p className="mt-2 text-sm text-muted">گالری خالی است.</p>
            <Link
              href="/gallery"
              className="mt-3 inline-flex text-sm font-medium text-foreground underline underline-offset-4"
            >
              افزودن تصویر
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedAsset ? (
              <div className="relative h-[218px] overflow-hidden rounded-[1.45rem] border border-white/80 bg-[#e7ded2]">
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
                <div className="absolute bottom-3 right-3 rounded-full bg-surface/86 px-3 py-1 text-xs font-medium text-[#554d43] backdrop-blur">
                  عکس انتخاب‌شده
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2">
              {galleryAssets.map((asset) => {
                const selected = selectedAsset?.id === asset.id;
                const label = asset.title || asset.originalName || "تصویر محصول";

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className={`relative overflow-hidden rounded-[0.9rem] border ${
                      selected ? "border-[#c7a96b] shadow-[0_18px_36px_-28px_rgba(17,16,14,0.58)]" : "border-white/72"
                    }`}
                    aria-label={label}
                  >
                    <span className="relative block aspect-square">
                      <SafeJewelryImage
                        src={asset.fileUrl}
                        alt={label}
                        fallbackSrc={uploadPreview.src}
                        fallbackAlt={uploadPreview.alt}
                        fill
                        className="object-cover"
                        sizes="33vw"
                      />
                    </span>
                    {selected ? (
                      <span className="absolute left-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                        <Check aria-hidden={true} className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 rounded-[1rem] border border-white/70 bg-surface/62 p-1 text-sm">
          <button
            type="button"
            onClick={() => setSourceMode("upload")}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-[0.8rem] transition ${
              sourceMode === "upload" ? "bg-foreground text-surface" : "bg-white/60 text-muted"
            }`}
          >
            <Upload aria-hidden={true} className="h-4 w-4" />
            آپلود
          </button>
          <button
            type="button"
            onClick={() => setSourceMode("gallery")}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-[0.8rem] transition ${
              sourceMode === "gallery" ? "bg-foreground text-surface" : "bg-white/60 text-muted"
            }`}
          >
            <Images aria-hidden={true} className="h-4 w-4" />
            گالری
          </button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 rounded-[1rem] border border-white/72 bg-surface/58 p-2 text-center">
        {outputPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setOutputPreset(preset.id)}
            className={`rounded-[0.8rem] px-2 py-2 text-[11px] font-medium ${
              outputPreset === preset.id ? "bg-foreground text-surface" : "bg-white/56 text-muted"
            }`}
          >
            <span className="block leading-none">{preset.label}</span>
            <span className="mt-1 block text-[10px] leading-none opacity-70" dir="ltr">
              {preset.ratio}
            </span>
          </button>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">سبک تصویر</p>
          <p className="text-[11px] font-medium text-muted">پیشنهاد استودیو</p>
        </div>

        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">انتخاب سبک خروجی</legend>
          {styles.map((preset) => {
            const checked = selectedStyle === preset.id;
            return (
              <label
                key={preset.id}
                className={`overflow-hidden rounded-[1rem] border bg-white/60 ${
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
                    sizes="(max-width: 768px) 45vw, 220px"
                  />
                </JewelryImageFrame>
                <p className="truncate px-3 py-2 text-xs font-medium text-foreground">{preset.label}</p>
              </label>
            );
          })}
        </fieldset>
      </section>

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
                    modelGender === item.value ? "border-border-strong bg-surface-soft text-foreground" : "border-border/70 text-muted"
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

      <Button type="submit" disabled={pending || !canSubmit} size="full" className="h-12 rounded-[1rem]">
        {pending ? "در حال ساخت..." : "ساخت تصویر"}
        <Sparkles aria-hidden={true} className="h-4 w-4" />
      </Button>
    </form>
  );
}
