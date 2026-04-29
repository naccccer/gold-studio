"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
import {
  EditorialSection,
  FloatingActionDock,
  ImageStage,
  QuietMeta,
  StudioFrame,
} from "@/components/ui/studio-primitives";
import type { ProjectFormState } from "@/features/projects/actions";
import { STYLE_PRESETS } from "@/features/projects/presets";

const INITIAL_STATE: ProjectFormState = {};

type GenerationMode = "image" | "text";

type NewProjectFormProps = {
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
};

export function NewProjectForm({ action }: NewProjectFormProps) {
  const [mode, setMode] = useState<GenerationMode>("image");
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form action={formAction} className="space-y-7 pb-20 sm:space-y-8 sm:pb-8">
      <input type="hidden" name="generationMode" value={mode} />

      <StudioFrame className="px-0 sm:px-0">
        <EditorialSection>
          <div className="flex items-center justify-between gap-3">
            <h3 className="block-title">تصویر محصول</h3>
            <QuietMeta>مرحله ۱</QuietMeta>
          </div>

          <ImageStage className="p-0">
            <label htmlFor="image" className="block cursor-pointer">
              {previewUrl ? (
                <div className="space-y-3 p-3 sm:p-4">
                  <Image
                    src={previewUrl}
                    alt="پیش‌نمایش تصویر محصول"
                    width={1400}
                    height={1400}
                    className="h-[52vh] max-h-[560px] min-h-[340px] w-full rounded-[var(--radius-lg)] object-cover"
                  />
                  <div className="px-1 pb-1 text-center">
                    <p className="text-sm font-medium text-foreground">برای تغییر تصویر دوباره لمس کن</p>
                    <QuietMeta>JPG / PNG / WEBP — حداکثر ۱۰MB</QuietMeta>
                  </div>
                </div>
              ) : (
                <div className="flex h-[56vh] min-h-[360px] flex-col items-center justify-center gap-4 px-5 py-8 text-center sm:min-h-[420px]">
                  <div className="w-full max-w-[320px] space-y-2">
                    <p className="section-title">تصویر محصولت را وارد کن</p>
                    <QuietMeta>یک عکس واضح با کادر تمیز، بهترین خروجی را می‌دهد.</QuietMeta>
                  </div>
                  <span className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-surface-contrast px-5 text-sm font-semibold text-surface">
                    انتخاب تصویر
                  </span>
                </div>
              )}
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
                if (!file) {
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setPreviewUrl(null);
                  return;
                }

                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(URL.createObjectURL(file));
              }}
            />
          </ImageStage>
        </EditorialSection>

        <EditorialSection>
          <div className="flex items-center justify-between gap-3">
            <h3 className="block-title">جهت هنری</h3>
            <QuietMeta>مرحله ۲</QuietMeta>
          </div>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">انتخاب جهت هنری</legend>
            {STYLE_PRESETS.map((preset) => (
              <label key={preset.id} className="group cursor-pointer">
                <input
                  type="radio"
                  name="stylePreset"
                  value={preset.id}
                  defaultChecked={preset.id === "CLEAN_WHITE"}
                  className="peer sr-only"
                />

                <div className="space-y-3 rounded-[var(--radius-lg)] bg-surface-soft p-4 ring-1 ring-inset ring-border-soft transition peer-checked:bg-surface peer-checked:ring-2 peer-checked:ring-surface-contrast group-hover:ring-border">
                  <div
                    aria-hidden
                    className={[
                      "h-20 w-full rounded-[var(--radius-md)]",
                      preset.id === "CLEAN_WHITE" && "bg-surface ring-1 ring-border-soft",
                      preset.id === "WARM_LUXURY" && "bg-[#f2e7d6] ring-1 ring-[#d8c2a0]",
                      preset.id === "DRAMATIC_DARK" && "bg-surface-contrast ring-1 ring-black/70",
                      preset.id === "SOFT_EDITORIAL" && "bg-[#e7e4de] ring-1 ring-[#c7c0b4]",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                    <QuietMeta>{preset.description}</QuietMeta>
                  </div>
                </div>
              </label>
            ))}
          </fieldset>
        </EditorialSection>

        <EditorialSection>
          <div className="flex items-center justify-between gap-3">
            <h3 className="block-title">جزئیات اختیاری</h3>
            <QuietMeta>مرحله ۳</QuietMeta>
          </div>

          <div className="space-y-3 rounded-[var(--radius-lg)] bg-surface-soft p-4">
            <Field label="عنوان پروژه" htmlFor="title" hint="برای نظم آرشیو؛ اختیاری است.">
              <input id="title" name="title" type="text" placeholder="مثلا: کالکشن حلقه مینیمال" className={fieldControlClassName} />
            </Field>

            <details className="group rounded-[var(--radius-md)] bg-surface p-3 ring-1 ring-border-soft">
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                اگر جهت خاصی مدنظر داری…
              </summary>
              <div className="mt-3 space-y-3">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={mode === "text"}
                    onChange={(event) => setMode(event.target.checked ? "text" : "image")}
                  />
                  حالت آزمایش متن‌محور
                </label>
                {mode === "text" ? (
                  <Field label="دستور متنی" htmlFor="textPrompt" hint="این بخش صرفا برای تست فنی است.">
                    <textarea
                      required
                      id="textPrompt"
                      name="textPrompt"
                      rows={4}
                      placeholder="مثلا: A premium studio photo of a gold ring on clean white background"
                      className="w-full resize-none rounded-[var(--radius-md)] bg-surface px-3 py-3 text-sm text-foreground ring-1 ring-inset ring-border outline-none transition placeholder:text-muted-foreground focus-visible:ring-border-strong focus-visible:shadow-[var(--shadow-focus)]"
                    />
                  </Field>
                ) : null}
              </div>
            </details>
          </div>
        </EditorialSection>
      </StudioFrame>

      {state.error ? (
        <p className="rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm text-danger ring-1 ring-danger/25">{state.error}</p>
      ) : null}

      <FloatingActionDock className="sm:static sm:mt-6 sm:p-0 sm:shadow-none sm:ring-0 sm:backdrop-blur-none sm:bg-transparent">
        <div className="w-full space-y-2 sm:w-auto sm:min-w-[320px]">
          <Button type="submit" disabled={pending} size="full" variant="contrast">
            {pending ? "در حال ساخت تصویر…" : mode === "image" ? "ساخت تصویر استودیویی" : "اجرای تست متن‌محور"}
          </Button>
          <QuietMeta className="px-1 text-center sm:text-right">نتیجه پس از تولید، مستقیم در اتاق نمایش باز می‌شود.</QuietMeta>
        </div>
      </FloatingActionDock>
    </form>
  );
}
