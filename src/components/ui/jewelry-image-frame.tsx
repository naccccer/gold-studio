import type { ReactNode } from "react";

export function JewelryImageFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={["overflow-hidden rounded-[var(--radius-xl)] border border-border/60 bg-surface shadow-[var(--shadow-soft)]", className].join(" ")}>
      {children}
    </div>
  );
}
