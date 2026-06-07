import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ImageFrameAspect = "square" | "portrait" | "landscape" | "gallery" | "story" | "banner" | "auto";
type ImageFrameTone = "default" | "photo" | "muted" | "dark" | "ink";

const aspectClasses: Record<ImageFrameAspect, string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[5/4]",
  gallery: "aspect-[1/1.18]",
  story: "aspect-[9/16]",
  banner: "aspect-[16/9]",
  auto: "",
};

const toneClasses: Record<ImageFrameTone, string> = {
  default: "bg-surface-soft border border-border",
  photo: "bg-surface-photo border border-border",
  muted: "bg-surface-muted border border-border",
  dark: "bg-ink-1 border border-ink-1/10",
  ink: "bg-ink-1 text-surface border border-ink-1/10",
};

type ImageFrameProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  aspect?: ImageFrameAspect;
  tone?: ImageFrameTone;
  selected?: boolean;
  disabled?: boolean;
  radius?: "md" | "lg" | "xl" | "2xl";
};

const radiusMap = {
  md: "rounded-[var(--r-md)]",
  lg: "rounded-[var(--r-lg)]",
  xl: "rounded-[var(--r-xl)]",
  "2xl": "rounded-[var(--r-2xl)]",
};

export function ImageFrame({
  children,
  className,
  aspect = "square",
  tone = "photo",
  selected = false,
  disabled = false,
  radius = "lg",
  ...props
}: ImageFrameProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        radiusMap[radius],
        toneClasses[tone],
        aspectClasses[aspect],
        selected && "ring-2 ring-champagne-400 ring-offset-2 ring-offset-bg",
        disabled && "grayscale opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
