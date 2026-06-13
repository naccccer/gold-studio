"use client";

import { ArrowDown2 } from "vuesax-icons-react";
import type { ReactNode } from "react";
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
  open: boolean;
  onChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
};

type StyleRangeControlProps = {
  controlKey: string;
  label: string;
  value: string;
  min: number;
  max: number;
  open: boolean;
  onChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
};

type StyleToggleControlProps = {
  controlKey: string;
  label: string;
  active: boolean;
  onChange: (active: boolean) => void;
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

function CollapsiblePanel({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity,transform] duration-200 ease-[var(--motion-ease-state)] ${
        open ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] -translate-y-1 opacity-0 pointer-events-none"
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export function StyleSegmentedChoiceControl({ controlKey, label, options, value, onChange }: Omit<StyleChoiceControlProps, "open" | "onOpenChange">) {
  return (
    <div className="space-y-2">
      <p className="truncate text-xs text-surface/72">{label}</p>
      <div className="grid grid-cols-2 gap-1 rounded-[0.9rem] border border-white/14 bg-white/[0.05] p-1">
        {options.map((item) => {
          const selected = value === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={`min-h-9 rounded-[0.7rem] px-2 text-sm font-semibold transition duration-200 ${
                selected ? "bg-accent-wash text-accent-deep" : "text-surface/78 hover:bg-white/[0.07] hover:text-surface"
              }`}
              aria-pressed={selected}
              data-control-key={controlKey}
            >
              <span className="block truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StyleChoiceControl({ controlKey, label, options, value, open, onChange, onOpenChange }: StyleChoiceControlProps) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="space-y-2">
      <p className="truncate text-xs text-surface/72">{label}</p>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-[0.9rem] border py-0 pr-3 pl-4 text-sm font-semibold outline-none transition duration-200 focus-visible:border-accent-bright focus-visible:shadow-[var(--shadow-focus)] ${
          open ? "border-accent-bright/70 bg-white/[0.09] text-surface" : "border-white/14 bg-white/[0.05] text-surface"
        }`}
        aria-expanded={open}
        data-control-key={controlKey}
      >
        <span className="flex min-w-0 items-center gap-2">
          <OptionSwatch value={selected?.value ?? ""} />
          <span className="truncate">{selected?.label}</span>
        </span>
        <ArrowDown2 aria-hidden={true} className={`h-3.5 w-3.5 shrink-0 text-surface/72 transition duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <CollapsiblePanel open={open}>
        <div className="mt-1.5 max-h-56 overflow-auto rounded-[0.9rem] border border-white/14 bg-[#171411] p-1.5 shadow-[0_22px_44px_-28px_rgba(0,0,0,0.85)]">
          {options.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                onChange(item.value);
                onOpenChange(false);
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
      </CollapsiblePanel>
    </div>
  );
}

export function StyleRangeControl({ controlKey, label, value, min, max, open, onChange, onOpenChange }: StyleRangeControlProps) {
  return (
    <div className="space-y-2">
      <p className="truncate text-xs text-surface/72">{label}</p>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-[0.9rem] border py-0 pr-3 pl-4 text-sm font-semibold outline-none transition duration-200 focus-visible:border-accent-bright focus-visible:shadow-[var(--shadow-focus)] ${
          open ? "border-accent-bright/70 bg-white/[0.09] text-surface" : "border-white/14 bg-white/[0.05] text-surface"
        }`}
        aria-expanded={open}
        data-control-key={controlKey}
      >
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 rounded-full border border-white/14 bg-white/[0.06] px-2 py-0.5 text-[10px]" dir="ltr">
          {value}
        </span>
      </button>
      <CollapsiblePanel open={open}>
        <div className="mt-1.5 rounded-[0.9rem] border border-white/14 bg-white/[0.04] px-3 py-3">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full accent-accent-bright"
          />
        </div>
      </CollapsiblePanel>
    </div>
  );
}

export function StyleToggleControl({ controlKey, label, active, onChange }: StyleToggleControlProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-[0.9rem] border px-3 text-right text-sm font-semibold transition duration-200 focus-visible:border-accent-bright focus-visible:shadow-[var(--shadow-focus)] ${
        active ? "border-accent-bright/70 bg-accent-wash text-accent-deep" : "border-white/14 bg-white/[0.05] text-surface/82 hover:bg-white/[0.08] hover:text-surface"
      }`}
      aria-pressed={active}
      data-control-key={controlKey}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full transition ${active ? "bg-accent-deep" : "bg-white/28"}`} aria-hidden={true} />
    </button>
  );
}
