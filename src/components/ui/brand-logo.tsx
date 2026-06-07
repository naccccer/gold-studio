import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type BrandLogoVariant =
  | "logo"
  | "mark"
  | "mark-light"
  | "wordmark"
  | "horizontal"
  | "primary"
  | "primary-light"
  | "primary-dark";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
};

const LOGOS: Record<BrandLogoVariant, { src: string; width: number; height: number; alt: string; className: string }> = {
  logo: {
    src: "/brand/Ovala Logo.svg",
    width: 1000,
    height: 1000,
    alt: "OVALA",
    className: "h-12 w-12 origin-center scale-[1.8]",
  },
  mark: {
    src: "/brand/ovala-mark.svg",
    width: 32,
    height: 32,
    alt: "OVALA",
    className: "h-8 w-8",
  },
  "mark-light": {
    src: "/brand/ovala-mark-light.svg",
    width: 32,
    height: 32,
    alt: "OVALA",
    className: "h-8 w-8",
  },
  wordmark: {
    src: "/brand/ovala-wordmark.svg",
    width: 138,
    height: 32,
    alt: "OVALA",
    className: "h-7 w-[120px]",
  },
  horizontal: {
    src: "/brand/ovala-horizontal.svg",
    width: 168,
    height: 40,
    alt: "OVALA",
    className: "h-10 w-[168px]",
  },
  primary: {
    src: "/brand/ovala-primary.svg",
    width: 174,
    height: 58,
    alt: "OVALA Studio",
    className: "h-[44px] w-[132px]",
  },
  "primary-light": {
    src: "/brand/ovala-primary-light.svg",
    width: 174,
    height: 58,
    alt: "OVALA Studio",
    className: "h-[44px] w-[132px]",
  },
  "primary-dark": {
    src: "/brand/ovala-primary-dark.svg",
    width: 174,
    height: 58,
    alt: "OVALA Studio",
    className: "h-[44px] w-[132px]",
  },
};

export function BrandLogo({ variant = "wordmark", className, priority = false }: BrandLogoProps) {
  const logo = LOGOS[variant];
  return (
    <span dir="ltr" className={cn("inline-flex items-center justify-center", className)}>
      <Image
        src={logo.src}
        width={logo.width}
        height={logo.height}
        alt={logo.alt}
        priority={priority}
        className={cn("object-contain object-center", logo.className)}
      />
    </span>
  );
}
