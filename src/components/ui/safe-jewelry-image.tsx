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

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={isFallback ? fallbackAlt ?? alt : alt}
      onError={(event) => {
        if (src && !isFallback) {
          setBrokenSrc(src);
        }
        onError?.(event);
      }}
    />
  );
}
