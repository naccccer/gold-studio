import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type StatusPillVariant = "neutral" | "pending" | "completed" | "failed" | "accent";

type StatusPillProps = {
  children: ReactNode;
  variant?: StatusPillVariant;
  className?: string;
};

const variantClasses: Record<StatusPillVariant, string> = {
  neutral: "border-border bg-surface-soft text-ink-3",
  pending: "border-champagne-200 bg-champagne-50 text-champagne-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  accent: "border-champagne-200 bg-champagne-50 text-champagne-700",
};

export function StatusPill({ children, variant = "neutral", className = "" }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold leading-none",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
