import type { ReactNode } from "react";

type StatusPillVariant = "neutral" | "pending" | "completed" | "failed";

type StatusPillProps = {
  children: ReactNode;
  variant?: StatusPillVariant;
  className?: string;
};

const variantClasses: Record<StatusPillVariant, string> = {
  neutral: "border-border bg-surface-soft text-muted",
  pending: "border-border-strong bg-surface-soft text-accent-foreground",
  completed: "border-accent-soft bg-accent-soft text-accent-foreground",
  failed: "border-danger/30 bg-danger-soft text-danger",
};

export function StatusPill({ children, variant = "neutral", className = "" }: StatusPillProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
