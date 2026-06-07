import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "pill";
  aspect?: "square" | "portrait" | "landscape" | "gallery" | "story" | "banner" | "text" | "circle";
};

const roundedMap = {
  sm: "rounded-[var(--r-sm)]",
  md: "rounded-[var(--r-md)]",
  lg: "rounded-[var(--r-lg)]",
  xl: "rounded-[var(--r-xl)]",
  "2xl": "rounded-[var(--r-2xl)]",
  pill: "rounded-[var(--r-pill)]",
};

const aspectMap = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[5/4]",
  gallery: "aspect-[1/1.18]",
  story: "aspect-[9/16]",
  banner: "aspect-[16/9]",
  text: "h-3.5 w-full",
  circle: "aspect-square rounded-full",
};

export function Skeleton({
  className,
  rounded = "md",
  aspect = "text",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "ov-skeleton",
        roundedMap[rounded],
        aspectMap[aspect],
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-[var(--r-lg)] border border-border bg-surface p-3 space-y-3">
      <Skeleton aspect="gallery" rounded="lg" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-[var(--r-lg)] border border-border bg-surface px-3.5 py-3">
      <Skeleton aspect="square" rounded="md" className="w-12" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
