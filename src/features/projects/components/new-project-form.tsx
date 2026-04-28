"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
import { Surface } from "@/components/ui/surface";
import type { ProjectFormState } from "@/features/projects/actions";
import { STYLE_PRESETS } from "@/features/projects/presets";

const INITIAL_STATE: ProjectFormState = {};

type GenerationMode = "image" | "text";

type NewProjectFormProps = {
  action: (
    prevState: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
};

const styleConfidenceMap: Record<string, string> = {
  CLEAN_WHITE: "مناسب کاتالوگ و فروشگاه",
  WARM_LUXURY: "مناسب ویترین برند لوکس",
  DRAMATIC_DARK: "مناسب کمپین‌های جسور",
  SOFT_EDITORIAL: "مناسب محتوای شبکه اجتماعی",
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

  const fileLabel = useMemo(() => {
    if (!previewUrl) {
      return "تصویر محصول را برای شروع انتخاب کنید";
    }

    return "برای جایگزینی تصویر، دوباره فایل انتخاب کنید";
  }, [previewUrl]);

  return (
    <form action={formAction} className="space-y-5 sm:space-y-6">
      <input type="hidden" name="generationMode" value={mode} />

      <Surface padding="lg" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">۱) تصویر محصول</h3>
          <p className="text-sm text-muted">یک عکس واضح وارد کنید تا استودیو بر همان تصویر تولید را آغاز کند.</p>
        </div>

        <div className="space-y-3">
          <Field hint="فرمت‌های مجاز: JPG، PNG، WEBP - حداکثر ۱۰MB" htmlFor="image" className="space-y-3">
            <label
              htmlFor="image"
              className="block cursor-pointer rounded-[var(--radius-lg)] border border-border bg-surface-soft p-4 sm:p-5"
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="پیش‌نمایش تصویر محصول"
                  width={1200}
                  height={1200}
                  className="h-64 w-full rounded-[var(--radius-md)] border border-border object-cover sm:h-80"
                />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-center sm:h-72">
                  <div className="space-y-2 px-4">
                    <p className="text-base font-medium text-foreground">{fileLabel}</p>
                    <p className="text-sm text-muted">نور ساده و کادر تمیز بهترین خروجی را می‌دهد.</p>
                  </div>
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
                  setPreviewUrl(null);
                  return;
                }

                setPreviewUrl(URL.createObjectURL(file));
              }}
            />
          </Field>

          <p className="text-sm text-muted">{fileLabel}</p>
        </div>
      </Surface>

      <Surface padding="lg" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">۲) انتخاب سبک خروجی</h3>
          <p className="text-sm text-muted">سبکی را انتخاب کنید که با جایگاه برند و نوع کمپین شما هماهنگ باشد.</p>
        </div>

        <fieldset className="space-y-3">
          <legend className="sr-only">انتخاب سبک خروجی</legend>
          <div className="grid gap-3">
            {STYLE_PRESETS.map((preset) => (
              <label
                key={preset.id}
                className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <input
                  type="radio"
                  name="stylePreset"
                  value={preset.id}
                  defaultChecked={preset.id === "CLEAN_WHITE"}
                  className="mt-1"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-foreground">{preset.label}</span>
                  <span className="block text-xs text-muted">{styleConfidenceMap[preset.id]}</span>
                  <span className="block text-sm text-muted">{preset.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Surface>

      <Surface padding="lg" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">۳) تنظیم نهایی</h3>
          <p className="text-sm text-muted">عنوان پروژه را وارد کنید. حالت تست متن فقط برای بررسی فنی است.</p>
        </div>

        <div className="grid grid-cols-2 rounded-[var(--radius-md)] border border-border bg-surface-soft p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("image")}
            className={`h-10 rounded-[var(--radius-sm)] transition ${
              mode === "image" ? "bg-surface font-medium text-foreground" : "text-muted"
            }`}
          >
            تصویر محصول
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`h-10 rounded-[var(--radius-sm)] transition ${
              mode === "text" ? "bg-surface font-medium text-foreground" : "text-muted"
            }`}
          >
            تست متن به تصویر
          </button>
        </div>

        <Field label="عنوان پروژه (اختیاری)" htmlFor="title">
          <input
            id="title"
            name="title"
            type="text"
            placeholder={mode === "image" ? "مثلا: کالکشن حلقه مینیمال" : "مثلا: تست اتصال GapGPT"}
            className={fieldControlClassName}
          />
        </Field>

        {mode === "text" ? (
          <Field
            label="پرامپت تست"
            htmlFor="textPrompt"
            hint="این بخش فقط برای تست مدل متن به تصویر است و در مسیر اصلی کاربر قرار ندارد."
          >
            <textarea
              required
              id="textPrompt"
              name="textPrompt"
              rows={4}
              placeholder="مثلا: A premium studio photo of a gold ring on a clean white background"
              className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-3 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-focus focus:shadow-[var(--shadow-focus)]"
            />
          </Field>
        ) : null}
      </Surface>

      {state.error ? (
        <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      ) : null}

      <Surface padding="lg" className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">۴) آغاز تولید</h3>
        <p className="text-sm text-muted">پس از شروع، استودیو تصویر نهایی را آماده می‌کند و مستقیم به صفحه نتیجه می‌روید.</p>
        <Button type="submit" disabled={pending} size="full">
          {pending ? "در حال تولید..." : mode === "image" ? "شروع تولید تصویر استودیویی" : "اجرای تست متن به تصویر"}
        </Button>
      </Surface>
    </form>
  );
}
