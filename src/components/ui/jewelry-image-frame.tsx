import type { HTMLAttributes, ReactNode } from "react";

type JewelryImageFrameProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  aspect?: "square" | "portrait" | "landscape" | "story" | "banner";
  treatment?: "standard" | "hero" | "quiet" | "dark";
};

const aspectClasses = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[5/4]",
  story: "aspect-[9/16]",
  banner: "aspect-[16/9]",
};

const treatmentClasses = {
  standard: "border border-white/80 bg-surface shadow-[var(--shadow-soft)]",
  hero: "border border-white/80 bg-surface-muted shadow-[0_30px_80px_-58px_rgba(23,20,17,0.65)]",
  quiet: "border border-border/60 bg-surface-soft shadow-none",
  dark: "border border-white/12 bg-[#11100e] shadow-[0_38px_100px_-64px_rgba(0,0,0,1)]",
};

export function JewelryImageFrame({ children, className = "", aspect = "square", treatment = "standard", ...props }: JewelryImageFrameProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[var(--radius-xl)]",
        treatmentClasses[treatment],
        aspectClasses[aspect],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
