import Image from "next/image";

type BrandLogoVariant = "logo" | "mark" | "mark-light" | "wordmark" | "horizontal" | "primary" | "primary-light" | "primary-dark" | "primary-on-dark";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
};

const logoConfig: Record<BrandLogoVariant, { src: string; width: number; height: number; alt: string; className: string }> = {
  logo: {
    src: "/brand/Ovala Logo.svg",
    width: 1000,
    height: 1000,
    alt: "OVALA",
    className: "h-14 w-14 origin-left scale-[2.25]",
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
    className: "h-8 w-[138px]",
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
    className: "h-[58px] w-[174px] translate-x-[10px] translate-y-[4px]",
  },
  "primary-light": {
    src: "/brand/ovala-primary-light.svg",
    width: 174,
    height: 58,
    alt: "OVALA Studio",
    className: "h-[58px] w-[174px] translate-x-[10px] translate-y-[4px]",
  },
  "primary-on-dark": {
    src: "/brand/ovala-primary-light-transparent.svg",
    width: 174,
    height: 58,
    alt: "OVALA Studio",
    className: "h-[58px] w-[174px] translate-x-[10px] translate-y-[4px]",
  },
  "primary-dark": {
    src: "/brand/ovala-primary-dark.svg",
    width: 174,
    height: 58,
    alt: "OVALA Studio",
    className: "h-[58px] w-[174px] translate-x-[10px] translate-y-[4px]",
  },
};

export function BrandLogo({ variant = "wordmark", className = "", priority = false }: BrandLogoProps) {
  const logo = logoConfig[variant];

  return (
    <span className={["inline-flex items-center justify-center", className].filter(Boolean).join(" ")} dir="ltr">
      <Image
        src={logo.src}
        width={logo.width}
        height={logo.height}
        alt={logo.alt}
        priority={priority}
        className={["object-contain object-center", logo.className].join(" ")}
      />
    </span>
  );
}
