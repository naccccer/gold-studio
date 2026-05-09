import Image from "next/image";

type BrandLogoVariant = "mark" | "mark-light" | "wordmark" | "primary" | "primary-dark";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
};

const logoConfig: Record<BrandLogoVariant, { src: string; width: number; height: number; alt: string; className: string }> = {
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
  primary: {
    src: "/brand/ovala-primary.svg",
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
