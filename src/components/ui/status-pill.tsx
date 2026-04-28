import type { ReactNode } from "react";

type StatusPillProps = {
  children: ReactNode;
  className?: string;
};

export function StatusPill({ children, className = "" }: StatusPillProps) {
  return (
    <span className={["rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700", className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
