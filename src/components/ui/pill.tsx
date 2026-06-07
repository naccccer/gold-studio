import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PillTone = "neutral" | "champagne" | "success" | "danger" | "info" | "ink" | "outline";
type PillSize = "xs" | "sm" | "md";

const toneClasses: Record<PillTone, string> = {
  neutral: "bg-surface-soft text-ink-2 border border-border-hairline",
  champagne: "bg-champagne-50 text-champagne-700 border border-champagne-100",
  success: "bg-success-soft text-success border border-success/15",
  danger: "bg-danger-soft text-danger border border-danger/15",
  info: "bg-info-soft text-info border border-info/15",
  ink: "bg-ink-1 text-surface border border-ink-1/10",
  outline: "bg-transparent text-ink-2 border border-border",
};

const sizeClasses: Record<PillSize, string> = {
  xs: "h-6 px-2.5 text-[10px] gap-1",
  sm: "h-7 px-3 text-[11px] gap-1.5",
  md: "h-8 px-3.5 text-xs gap-1.5",
};

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
  size?: PillSize;
  icon?: ReactNode;
};

export function Pill({ tone = "neutral", size = "sm", icon, className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "ov-press inline-flex items-center justify-center rounded-[var(--r-pill)] font-semibold leading-none whitespace-nowrap",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
