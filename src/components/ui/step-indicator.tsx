import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Step = {
  id: string;
  label: string;
};

type StepIndicatorProps = {
  steps: Step[];
  current: string;
  tone?: "light" | "dark";
  className?: string;
};

export function StepIndicator({ steps, current, tone = "light", className }: StepIndicatorProps) {
  const isDark = tone === "dark";
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === current),
  );
  return (
    <ol
      dir="ltr"
      className={cn("flex w-full items-center gap-1.5", className)}
      aria-label="مراحل"
    >
      {steps.map((step, index) => {
        const completed = index < currentIndex;
        const active = index === currentIndex;
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-1.5 last:flex-none">
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-pill)] text-[11px] font-bold",
                completed && "bg-champagne-500 text-champagne-ink",
                active && (isDark ? "bg-white text-ink-1" : "bg-ink-1 text-surface"),
                !completed && !active && (isDark
                  ? "bg-white/5 text-white/55 border border-white/12"
                  : "bg-surface-soft text-ink-3 border border-border"),
              )}
              aria-current={active ? "step" : undefined}
            >
              {completed ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : index + 1}
            </span>
            <span
              className={cn(
                "shrink-0 text-[11px] font-semibold leading-4 whitespace-nowrap",
                active
                  ? isDark
                    ? "text-white"
                    : "text-ink-1"
                  : isDark
                    ? "text-white/55"
                    : "text-ink-3",
              )}
            >
              {step.label}
            </span>
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  "h-px min-w-0 flex-1",
                  index < currentIndex
                    ? "bg-champagne-500"
                    : isDark
                      ? "bg-white/12"
                      : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
