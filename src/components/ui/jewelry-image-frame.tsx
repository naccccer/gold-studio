import type { HTMLAttributes, ReactNode } from "react";

type JewelryImageFrameProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  aspect?: "square" | "portrait" | "landscape" | "gallery" | "story" | "banner";
  treatment?: "standard" | "hero" | "quiet" | "dark";
  selected?: boolean;
  disabled?: boolean;
};

const aspectClasses = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[5/4]",
  gallery: "aspect-[1/1.18]",
  story: "aspect-[9/16]",
  banner: "aspect-[16/9]",
};

const treatmentClasses = {
  standard: "border border-white/80 bg-surface-photo shadow-[var(--shadow-image)]",
  hero: "border border-white/80 bg-surface-photo shadow-[var(--shadow-image-strong)]",
  quiet: "border border-border/60 bg-surface-soft shadow-none",
  dark: "border border-white/12 bg-studio-surface shadow-[var(--shadow-studio-frame)]",
};

export function JewelryImageFrame({ children, className = "", aspect = "square", treatment = "standard", selected = false, disabled = false, ...props }: JewelryImageFrameProps) {
  return (
    <div
      className={[
        "motion-selected relative overflow-hidden rounded-[var(--radius-2xl)]",
        treatmentClasses[treatment],
        selected
          ? "border-accent-bright shadow-[0_20px_42px_-26px_rgba(17,16,14,0.72)] ring-2 ring-accent-bright ring-offset-2 ring-offset-surface"
          : "",
        disabled ? "grayscale-[35%] opacity-75" : "",
        aspectClasses[aspect],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

type ImageOverlayPillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "light" | "dark" | "accent" | "danger";
};

const overlayToneClasses = {
  light: "border-white/50 bg-surface/86 text-muted backdrop-blur",
  dark: "border-white/18 bg-black/34 text-white/86 backdrop-blur",
  accent: "border-accent-soft bg-accent-wash/92 text-accent-deep backdrop-blur",
  danger: "border-danger/30 bg-danger-soft/92 text-danger backdrop-blur",
};

export function ImageOverlayPill({ tone = "light", className = "", ...props }: ImageOverlayPillProps) {
  return (
    <span
      className={[
        "motion-state inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none",
        overlayToneClasses[tone],
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
