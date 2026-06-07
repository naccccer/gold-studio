"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type SegmentedItem<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
};

type SegmentedControlProps<T extends string> = {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3 | 4 | 5;
  label?: string;
  ariaLabel?: string;
  className?: string;
  compact?: boolean;
};

const columnClasses: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  columns = 3,
  ariaLabel,
  className,
  compact = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("grid gap-2", columnClasses[columns], className)}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(item.value)}
            className={cn(
              "ov-press relative flex w-full flex-col items-start gap-1 rounded-[var(--r-md)]",
              "border bg-surface text-right",
              compact ? "min-h-12 px-3 py-2" : "min-h-14 px-3.5 py-3",
              selected
                ? "border-champagne-400 shadow-[var(--shadow-sm)]"
                : "border-border hover:border-border-strong",
            )}
          >
            <span
              className={cn(
                "flex w-full items-center gap-2",
                compact ? "text-[12px]" : "text-[13px]",
                "font-semibold",
                selected ? "text-ink-1" : "text-ink-2",
              )}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </span>
            {item.description ? (
              <span className="text-[11px] leading-5 text-ink-3">
                {item.description}
              </span>
            ) : null}
            {item.badge}
            {selected ? (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-champagne-500"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
