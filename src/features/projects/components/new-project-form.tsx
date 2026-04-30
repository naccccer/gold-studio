"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import type { ProjectFormState } from "@/features/projects/actions";
import { STYLE_PRESETS } from "@/features/projects/presets";
import { stylePresets as jewelryStylePresets, uploadPreview } from "@/lib/placeholders/jewelry-images";

const INITIAL_STATE: ProjectFormState = {};
type GenerationMode = "image" | "text";

type NewProjectFormProps = {
  action: (
    prevState: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
};

const curatedStyleOptions = [
  { preset: STYLE_PRESETS[0], image: jewelryStylePresets[0] },
  { preset: STYLE_PRESETS[2], image: jewelryStylePresets[1] },
  { preset: STYLE_PRESETS[1], image: jewelryStylePresets[2] },
].filter((item) => item.preset && item.image);

export function NewProjectForm({ action }: NewProjectFormProps) {
  const [mode, setMode] = useState<GenerationMode>("image");
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fileLabel = useMemo(() => (previewUrl ? "جایگزینی" : "انتخاب تصویر"), [previewUrl]);

  return (
    <form action={formAction} className="space-y-7">
      <input type="hidden" name="generationMode" value={mode} />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.66fr)] lg:items-start">
        <Field htmlFor="image" className="space-y-3">
          <label htmlFor="image" className="group block cursor-pointer space-y-3">
            <JewelryImageFrame aspect="portrait" className="min-h-[470px] bg-surface-soft shadow-none transition group-hover:border-border-strong">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="پیش‌نمایش تصویر محصول"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 560px"
                />
              ) : (
                <Image
                  src={uploadPreview.src}
                  alt={uploadPreview.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 560px"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-5">
                <div className="flex items-end justify-between gap-4 text-surface">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{previewUrl ? "تصویر آماده" : "تصویر محصول"}</p>
                    <p className="text-[11px] text-surface/75">JPG, PNG, WEBP</p>
                  </div>
                  <span className="rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs">
                    {fileLabel}
                  </span>
                </div>
              </div>
            </JewelryImageFrame>
          </label>

          <input
            required={mode === "image"}
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
        </Field>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs text-muted">سبک</h3>
          </div>

          <fieldset className="grid grid-cols-3 gap-2.5 lg:grid-cols-1">
            <legend className="sr-only">انتخاب سبک خروجی</legend>
            {curatedStyleOptions.map(({ preset, image }) => (
              <label
                key={preset.id}
                className="group cursor-pointer space-y-2 rounded-[var(--radius-lg)] border border-transparent p-1 transition has-[:checked]:border-focus has-[:checked]:bg-surface"
              >
                <input
                  type="radio"
                  name="stylePreset"
                  value={preset.id}
                  defaultChecked={preset.id === "CLEAN_WHITE"}
                  className="sr-only"
                />
                <JewelryImageFrame aspect="square" className="rounded-[var(--radius-md)] bg-surface-soft shadow-none">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 30vw, 220px"
                  />
                </JewelryImageFrame>
                <p className="truncate px-1 text-center text-xs font-medium text-foreground lg:text-right">
                  {preset.label}
                </p>
              </label>
            ))}
          </fieldset>
        </section>
      </section>

      <details className="group rounded-[var(--radius-md)] border border-border/60 bg-surface/45 px-3 py-2">
        <summary className="cursor-pointer text-xs text-muted">جزئیات بیشتر</summary>
        <div className="mt-4 space-y-4">
          <Field label="عنوان پروژه (اختیاری)" htmlFor="title">
            <input
              id="title"
              name="title"
              type="text"
              placeholder="مثلا: انگشتر نامزدی"
              className={fieldControlClassName}
            />
          </Field>

          <div className="grid grid-cols-2 rounded-[var(--radius-md)] border border-border bg-surface p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("image")}
              className={`h-9 rounded-[var(--radius-sm)] ${mode === "image" ? "bg-surface-soft font-medium text-foreground" : "text-muted"}`}
            >
              تصویر محصول
            </button>
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`h-9 rounded-[var(--radius-sm)] ${mode === "text" ? "bg-surface-soft font-medium text-foreground" : "text-muted"}`}
            >
              تست متنی
            </button>
          </div>

          {mode === "text" ? (
            <Field label="پرامپت تست" htmlFor="textPrompt">
              <textarea
                required
                id="textPrompt"
                name="textPrompt"
                rows={4}
                placeholder="A premium studio photo of a gold ring"
                className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-3 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-focus focus:shadow-[var(--shadow-focus)]"
              />
            </Field>
          ) : null}
        </div>
      </details>

      {state.error ? (
        <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <section className="space-y-3 pb-3">
        <Button type="submit" disabled={pending} size="full" className="h-12">
          {pending ? "در حال تولید..." : mode === "image" ? "ادامه و تولید تصویر" : "اجرای تست متنی"}
        </Button>
      </section>
    </form>
  );
}
