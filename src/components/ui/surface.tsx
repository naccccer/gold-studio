import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type SurfaceTone = "default" | "soft" | "muted" | "raised" | "glass" | "ink";
type SurfaceRadius = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "pill";
type SurfacePad = "none" | "xs" | "sm" | "md" | "lg" | "xl";

const toneClasses: Record<SurfaceTone, string> = {
  default: "bg-surface border border-border",
  soft: "bg-surface-soft border border-border-hairline",
  muted: "bg-surface-muted border border-border",
  raised: "bg-surface border border-border shadow-[var(--shadow-md)]",
  glass: "bg-surface/75 backdrop-blur-xl border border-border-hairline",
  ink: "bg-ink-1 text-surface border border-ink-1/10",
};

const radiusClasses: Record<SurfaceRadius, string> = {
  sm: "rounded-[var(--r-sm)]",
  md: "rounded-[var(--r-md)]",
  lg: "rounded-[var(--r-lg)]",
  xl: "rounded-[var(--r-xl)]",
  "2xl": "rounded-[var(--r-2xl)]",
  "3xl": "rounded-[var(--r-3xl)]",
  pill: "rounded-[var(--r-pill)]",
};

const padClasses: Record<SurfacePad, string> = {
  none: "",
  xs: "p-2",
  sm: "p-3",
  md: "p-4",
  lg: "p-5 sm:p-6",
  xl: "p-6 sm:p-8",
};

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "aside" | "header" | "footer";
  tone?: SurfaceTone;
  radius?: SurfaceRadius;
  padding?: SurfacePad;
};

export function Surface({
  as: Component = "div",
  tone = "default",
  radius = "lg",
  padding = "md",
  className,
  ...props
}: SurfaceProps) {
  return (
    <Component
      className={cn(
        toneClasses[tone],
        radiusClasses[radius],
        padClasses[padding],
        className,
      )}
      {...props}
    />
  );
}
