"use client";

import Image, { type ImageProps, type StaticImageData } from "next/image";
import { useState } from "react";

type SafeJewelryImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | StaticImageData | null;
  alt: string;
  fallbackSrc: string | StaticImageData;
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
  const srcKey = typeof src === "string" ? src : null;
  const currentSrc = src && brokenSrc !== srcKey ? src : fallbackSrc;
  const isFallback = currentSrc === fallbackSrc;
  const currentSrcKey = typeof currentSrc === "string" ? currentSrc : currentSrc.src;
  const shouldBypassOptimization =
    typeof currentSrc === "string" && (currentSrc.startsWith("/uploads/") || currentSrc.startsWith("/api/storage/"));

  return (
    <Image
      {...props}
      key={currentSrcKey}
      src={currentSrc}
      alt={isFallback ? fallbackAlt ?? alt : alt}
      unoptimized={shouldBypassOptimization}
      onError={(event) => {
        if (srcKey && !isFallback) {
          setBrokenSrc(srcKey);
        }
        onError?.(event);
      }}
    />
  );
}
