import type { HTMLAttributes } from "react";
type SurfacePadding = "sm" | "md" | "lg";
type SurfaceRadius = "md" | "lg" | "xl";
const paddingClasses: Record<SurfacePadding, string> = { sm: "p-3", md: "p-4", lg: "p-5 sm:p-6" };
const radiusClasses: Record<SurfaceRadius, string> = { md: "rounded-[var(--radius-md)]", lg: "rounded-[var(--radius-lg)]", xl: "rounded-[var(--radius-xl)]" };

export function Surface({ as: Component = "div", padding = "md", radius = "lg", className = "", ...props }: HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "article"; padding?: SurfacePadding; radius?: SurfaceRadius }) {
  return <Component className={[radiusClasses[radius], "border border-border/70 bg-surface", paddingClasses[padding], className].filter(Boolean).join(" ")} {...props} />;
}
