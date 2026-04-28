import type { HTMLAttributes } from "react";

type SurfacePadding = "sm" | "md" | "lg";
type SurfaceRadius = "md" | "lg" | "xl";

const paddingClasses: Record<SurfacePadding, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const radiusClasses: Record<SurfaceRadius, string> = {
  md: "rounded-2xl",
  lg: "rounded-3xl",
  xl: "rounded-[2rem]",
};

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article";
  padding?: SurfacePadding;
  radius?: SurfaceRadius;
};

export function Surface({
  as: Component = "div",
  padding = "md",
  radius = "lg",
  className = "",
  ...props
}: SurfaceProps) {
  return (
    <Component
      className={[
        radiusClasses[radius],
        "border border-slate-200 bg-white",
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
