import type { ReactNode } from "react";

type ProgressiveHintProps = { title: string; children: ReactNode; className?: string };

export function ProgressiveHint({ title, children, className = "" }: ProgressiveHintProps) {
  return (
    <div className={["inline-flex max-w-sm items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface-soft px-3 py-2 text-xs text-muted", className].join(" ")}>
      <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <p>
        <span className="text-foreground">{title}: </span>
        {children}
      </p>
    </div>
  );
}
