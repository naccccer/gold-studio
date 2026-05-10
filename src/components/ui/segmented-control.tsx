import type { ReactNode } from "react";

export type SegmentedControlItem<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
};

type SegmentedControlProps<T extends string> = {
  items: SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  label?: string;
  className?: string;
};

const columnClasses = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  columns = 3,
  label,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div className={["grid gap-2", columnClasses[columns], className].filter(Boolean).join(" ")} role="radiogroup" aria-label={label}>
      {items.map((item) => {
        const selected = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(item.value)}
            className={[
              "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
              selected
                ? "border-accent-bright bg-surface text-foreground shadow-[0_14px_26px_-24px_rgba(17,16,14,0.62)]"
                : "border-white/72 bg-surface/58 text-muted hover:border-border-strong hover:text-foreground",
            ].join(" ")}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
