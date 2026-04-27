"use client";

import { useActionState } from "react";
import type { ProjectFormState } from "@/features/projects/actions";
import { STYLE_PRESETS } from "@/features/projects/presets";

const INITIAL_STATE: ProjectFormState = {};

type NewProjectFormProps = {
  action: (
    prevState: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
};

export function NewProjectForm({ action }: NewProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="space-y-2">
        <label className="text-sm text-slate-700" htmlFor="title">
          عنوان پروژه (اختیاری)
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="مثلا: انگشتر طلای زنانه"
          className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-amber-200 transition focus:ring"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-700" htmlFor="image">
          تصویر محصول
        </label>
        <input
          required
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full rounded-xl border border-slate-200 p-2 text-sm"
        />
        <p className="text-xs text-slate-500">فرمت‌های مجاز: JPG, PNG, WEBP — حداکثر ۱۰MB</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm text-slate-700">انتخاب سبک خروجی</legend>
        <div className="grid gap-2">
          {STYLE_PRESETS.map((preset) => (
            <label
              key={preset.id}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-amber-300"
            >
              <input type="radio" name="stylePreset" value={preset.id} defaultChecked={preset.id === "CLEAN_WHITE"} />
              <span>
                <span className="block text-sm font-medium text-slate-900">{preset.label}</span>
                <span className="block text-xs text-slate-500">{preset.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "در حال تولید..." : "آپلود و شروع تولید"}
      </button>
    </form>
  );
}
