import type { HTMLAttributes } from "react";

type SurfacePadding = "sm" | "md" | "lg";
type SurfaceRadius = "md" | "lg" | "xl";
type SurfaceTone = "panel" | "quiet" | "open" | "image-stage" | "contrast";

const paddingClasses: Record<SurfacePadding, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5 sm:p-6",
};

const radiusClasses: Record<SurfaceRadius, string> = {
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  xl: "rounded-[var(--radius-xl)]",
};

const toneClasses: Record<SurfaceTone, string> = {
  panel: "bg-surface ring-1 ring-inset ring-border-soft shadow-[var(--shadow-soft)]",
  quiet: "bg-surface-soft",
  open: "bg-transparent",
  "image-stage": "bg-surface ring-1 ring-inset ring-border shadow-[var(--shadow-float)]",
  contrast: "bg-surface-contrast text-surface shadow-[var(--shadow-float)]",
};

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article";
  padding?: SurfacePadding;
  radius?: SurfaceRadius;
  tone?: SurfaceTone;
};

export function Surface({
  as: Component = "div",
  padding = "md",
  radius = "lg",
  tone = "panel",
  className = "",
  ...props
}: SurfaceProps) {
  return (
    <Component
      className={[radiusClasses[radius], toneClasses[tone], paddingClasses[padding], className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
