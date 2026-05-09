"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type SafeJewelryImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  fallbackSrc: string;
  fallbackAlt?: string;
};

export function SafeJewelryImage({
  src,
  alt,
  fallbackSrc,
  fallbackAlt,
  onError,
  ...props
}: SafeJewelryImageProps) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const currentSrc = src && brokenSrc !== src ? src : fallbackSrc;
  const isFallback = currentSrc === fallbackSrc;
  const shouldBypassOptimization =
    typeof currentSrc === "string" && (currentSrc.startsWith("/uploads/") || currentSrc.startsWith("/api/storage/"));

  return (
    <Image
      {...props}
      key={currentSrc}
      src={currentSrc}
      alt={isFallback ? fallbackAlt ?? alt : alt}
      unoptimized={shouldBypassOptimization}
      onError={(event) => {
        if (src && !isFallback) {
          setBrokenSrc(src);
        }
        onError?.(event);
      }}
    />
  );
}
