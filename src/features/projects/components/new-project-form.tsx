"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { ProgressiveHint } from "@/components/ui/progressive-hint";
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

export function NewProjectForm({ action }: NewProjectFormProps) {
  const [mode, setMode] = useState<GenerationMode>("image");
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fileLabel = useMemo(() => (previewUrl ? "جایگزینی تصویر" : "انتخاب تصویر محصول"), [previewUrl]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="generationMode" value={mode} />

      <section className="space-y-3">
        <Field hint="JPG, PNG, WEBP · حداکثر ۱۰MB" htmlFor="image" className="space-y-3">
          <label htmlFor="image" className="block cursor-pointer space-y-3">
            <JewelryImageFrame aspect="portrait" className="bg-surface-soft">
              {previewUrl ? (
                <Image src={previewUrl} alt="پیش‌نمایش تصویر محصول" fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
              ) : (
                <>
                  <Image src={uploadPreview.src} alt={uploadPreview.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5">
                    <div className="space-y-2 text-surface">
                      <p className="text-base font-medium">تصویر محصول را وارد کنید</p>
                      <p className="text-xs text-surface/80">نور نرم و کادر ساده، نتیجه بهتری می‌دهد.</p>
                    </div>
                  </div>
                </>
              )}
            </JewelryImageFrame>
            <p className="text-sm text-muted">{fileLabel}</p>
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
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
          />
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm text-muted">سبک خروجی</h3>
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="sr-only">انتخاب سبک خروجی</legend>
          {STYLE_PRESETS.slice(0, 3).map((preset, index) => {
            const presetImage = jewelryStylePresets[index];

            return (
              <label key={preset.id} className="cursor-pointer space-y-2 rounded-[var(--radius-lg)] border border-border bg-surface p-3 transition hover:border-border-strong has-[:checked]:border-focus">
                <input type="radio" name="stylePreset" value={preset.id} defaultChecked={preset.id === "CLEAN_WHITE"} className="sr-only" />
                {presetImage ? (
                  <JewelryImageFrame aspect="landscape" className="rounded-[var(--radius-md)] shadow-none">
                    <Image src={presetImage.src} alt={presetImage.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 220px" />
                  </JewelryImageFrame>
                ) : null}
                <p className="text-sm font-medium text-foreground">{preset.label}</p>
                <p className="text-xs text-muted">{preset.description}</p>
              </label>
            );
          })}
        </fieldset>
      </section>

      <section className="space-y-3">
        <Field label="عنوان پروژه (اختیاری)" htmlFor="title">
          <input id="title" name="title" type="text" placeholder="مثلا: کالکشن انگشتر کلاسیک" className={fieldControlClassName} />
        </Field>

        <details className="rounded-[var(--radius-md)] border border-border bg-surface-soft p-3">
          <summary className="cursor-pointer text-xs text-muted">تنظیمات پیشرفته</summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 rounded-[var(--radius-md)] border border-border bg-surface p-1 text-sm">
              <button type="button" onClick={() => setMode("image")} className={`h-9 rounded-[var(--radius-sm)] ${mode === "image" ? "bg-surface-soft font-medium text-foreground" : "text-muted"}`}>
                تصویر محصول
              </button>
              <button type="button" onClick={() => setMode("text")} className={`h-9 rounded-[var(--radius-sm)] ${mode === "text" ? "bg-surface-soft font-medium text-foreground" : "text-muted"}`}>
                تست متن به تصویر
              </button>
            </div>

            {mode === "text" ? (
              <Field label="پرامپت تست" htmlFor="textPrompt">
                <textarea required id="textPrompt" name="textPrompt" rows={4} placeholder="A premium studio photo of a gold ring" className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-3 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-focus focus:shadow-[var(--shadow-focus)]" />
              </Field>
            ) : null}
          </div>
        </details>
      </section>

      {state.error ? <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p> : null}

      <section className="space-y-3 pb-3">
        <ProgressiveHint title="خروجی">پس از شروع، مستقیم به صفحه نتیجه می‌روید.</ProgressiveHint>
        <Button type="submit" disabled={pending} size="full">{pending ? "در حال تولید..." : mode === "image" ? "شروع تولید تصویر" : "اجرای تست متن به تصویر"}</Button>
      </section>
    </form>
  );
}
