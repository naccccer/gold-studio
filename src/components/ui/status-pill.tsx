import type { ReactNode } from "react";
export function StatusPill({ children, variant = "neutral", className = "" }: { children: ReactNode; variant?: "neutral" | "pending" | "completed" | "failed"; className?: string }) {
  const variantClasses = {
    neutral: "border-border bg-surface-soft text-muted",
    pending: "border-border-strong bg-surface-soft text-foreground",
    completed: "border-accent/35 bg-accent-soft text-accent-foreground",
    failed: "border-danger/30 bg-danger-soft text-danger",
  };
  return <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs", variantClasses[variant], className].filter(Boolean).join(" ")}>{children}</span>;
}
