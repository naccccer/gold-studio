import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Step = {
  id: string;
  label: string;
};

type StepIndicatorProps = {
  steps: Step[];
  current: string;
  className?: string;
};

export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === current),
  );
  return (
    <ol
      dir="ltr"
      className={cn("flex items-center gap-2", className)}
      aria-label="مراحل"
    >
      {steps.map((step, index) => {
        const completed = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-pill)] text-[11px] font-bold",
                completed && "bg-champagne-500 text-champagne-ink",
                active && "bg-ink-1 text-surface",
                !completed && !active && "bg-surface-soft text-ink-3 border border-border",
              )}
              aria-current={active ? "step" : undefined}
            >
              {completed ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : index + 1}
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold leading-4 truncate",
                active ? "text-ink-1" : "text-ink-3",
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "h-px flex-1",
                  index < currentIndex ? "bg-champagne-400" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
