"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
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

export function NewProjectForm({ action }: NewProjectFormProps) {
  const [mode, setMode] = useState<GenerationMode>("image");
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
      <input type="hidden" name="generationMode" value={mode} />

      <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("image")}
          className={`h-10 rounded-xl transition ${mode === "image" ? "bg-white font-medium text-slate-950 shadow-sm" : "text-slate-500"}`}
        >
          ØªØµÙˆÛŒØ± Ù…Ø­ØµÙˆÙ„
        </button>
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`h-10 rounded-xl transition ${mode === "text" ? "bg-white font-medium text-slate-950 shadow-sm" : "text-slate-500"}`}
        >
          ØªØ³Øª Ù…ØªÙ† Ø¨Ù‡ ØªØµÙˆÛŒØ±
        </button>
      </div>

      <Field label="Ø¹Ù†ÙˆØ§Ù† Ù¾Ø±ÙˆÚ˜Ù‡ (Ø§Ø®ØªÛŒØ§Ø±ÛŒ)" htmlFor="title">
        <input
          id="title"
          name="title"
          type="text"
          placeholder={mode === "image" ? "Ù…Ø«Ù„Ø§: Ø§Ù†Ú¯Ø´ØªØ± Ø·Ù„Ø§ÛŒ Ø²Ù†Ø§Ù†Ù‡" : "Ù…Ø«Ù„Ø§: ØªØ³Øª Ø§ØªØµØ§Ù„ GapGPT"}
          className={fieldControlClassName}
        />
      </Field>

      {mode === "image" ? (
        <Field
          label="ØªØµÙˆÛŒØ± Ù…Ø­ØµÙˆÙ„"
          htmlFor="image"
          hint="ÙØ±Ù…Øªâ€ŒÙ‡Ø§ÛŒ Ù…Ø¬Ø§Ø²: JPG, PNG, WEBP - Ø­Ø¯Ø§Ú©Ø«Ø± Û±Û°MB"
        >
          <input
            required
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full rounded-xl border border-slate-200 p-2 text-sm"
          />
        </Field>
      ) : (
        <Field
          label="Ù¾Ø±Ø§Ù…Ù¾Øª ØªØ³Øª"
          htmlFor="textPrompt"
          hint="Ø§ÛŒÙ† Ø­Ø§Ù„Øª ÙÙ‚Ø· Ø§ØªØµØ§Ù„ Ùˆ Ù…Ø¯Ù„ Ù…ØªÙ† Ø¨Ù‡ ØªØµÙˆÛŒØ± GapGPT Ø±Ø§ ØªØ³Øª Ù…ÛŒâ€ŒÚ©Ù†Ø¯."
        >
          <textarea
            required
            id="textPrompt"
            name="textPrompt"
            rows={4}
            placeholder="Ù…Ø«Ù„Ø§: A premium studio photo of a gold ring on a clean white background"
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none ring-amber-200 transition focus:ring"
          />
        </Field>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm text-slate-700">Ø§Ù†ØªØ®Ø§Ø¨ Ø³Ø¨Ú© Ø®Ø±ÙˆØ¬ÛŒ</legend>
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

      <Button type="submit" disabled={pending} size="full">
        {pending ? "Ø¯Ø± Ø­Ø§Ù„ ØªÙˆÙ„ÛŒØ¯..." : mode === "image" ? "Ø¢Ù¾Ù„ÙˆØ¯ Ùˆ Ø´Ø±ÙˆØ¹ ØªÙˆÙ„ÛŒØ¯" : "Ø§Ø¬Ø±Ø§ÛŒ ØªØ³Øª Ù…ØªÙ† Ø¨Ù‡ ØªØµÙˆÛŒØ±"}
      </Button>
    </form>
  );
}
