"use client";

import { ChevronsDown } from "lucide-react";
import type { StyleControlOption } from "@/features/projects/presets";

const optionSwatches: Record<string, string> = {
  white: "#f8f6f0",
  cream: "#ead9b8",
  lightGray: "#d9d8d4",
  blush: "#e8cfc8",
  navy: "#17233f",
  charcoal: "#2f3134",
  softBlack: "#10100f",
  forest: "#1f3028",
  burgundy: "#4b1f2c",
  espresso: "#2a1f19",
};

type StyleChoiceControlProps = {
  controlKey: string;
  label: string;
  options: StyleControlOption[];
  value: string;
  onChange: (value: string) => void;
};

function OptionSwatch({ value }: { value: string }) {
  const color = optionSwatches[value];
  if (!color) return null;

  return (
    <span
      aria-hidden={true}
      className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30 shadow-[0_5px_10px_-8px_rgba(0,0,0,0.9)]"
      style={{ backgroundColor: color }}
    />
  );
}

export function StyleChoiceControl({ controlKey, label, options, value, onChange }: StyleChoiceControlProps) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="space-y-2">
      <p className="text-xs text-surface/72">{label}</p>
      <details className="group relative">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-[0.9rem] border border-white/14 bg-white/[0.05] py-0 pr-3 pl-4 text-sm font-semibold text-surface outline-none transition focus-visible:border-accent-bright focus-visible:shadow-[var(--shadow-focus)] [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-2">
            <OptionSwatch value={selected?.value ?? ""} />
            <span className="truncate">{selected?.label}</span>
          </span>
          <ChevronsDown aria-hidden={true} className="h-3.5 w-3.5 shrink-0 text-surface/72 transition group-open:rotate-180" />
        </summary>
        <div className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 max-h-64 overflow-auto rounded-[0.9rem] border border-white/14 bg-[#171411] p-1.5 shadow-[0_22px_44px_-28px_rgba(0,0,0,0.85)]">
          {options.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={(event) => {
                onChange(item.value);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              className={`flex min-h-9 w-full items-center gap-2 rounded-[0.7rem] px-2.5 text-right text-sm transition ${
                value === item.value ? "bg-accent-wash/95 font-semibold text-accent-deep" : "text-surface/86 hover:bg-white/[0.07]"
              }`}
              aria-label={`${label}: ${item.label}`}
              aria-current={value === item.value ? "true" : undefined}
              data-control-key={controlKey}
            >
              <OptionSwatch value={item.value} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
