import type { ReactNode } from "react";

type StatusPillVariant = "neutral" | "pending" | "completed" | "failed";

type StatusPillProps = {
  children: ReactNode;
  variant?: StatusPillVariant;
  className?: string;
};

const variantClasses: Record<StatusPillVariant, string> = {
  neutral: "bg-surface-soft text-muted ring-border-soft",
  pending: "bg-accent-soft/55 text-accent-foreground ring-accent/30",
  completed: "bg-surface-contrast text-surface ring-surface-contrast",
  failed: "bg-danger-soft text-danger ring-danger/30",
};

export function StatusPill({ children, variant = "neutral", className = "" }: StatusPillProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
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
