import Image from "next/image";
import type { JewelryPlaceholderImage } from "@/lib/placeholders/jewelry-images";

type BeforeAfterImageProps = {
  before: JewelryPlaceholderImage;
  after: JewelryPlaceholderImage;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function BeforeAfterImage({
  before,
  after,
  className = "",
  priority = false,
  sizes = "(max-width: 640px) 100vw, 420px",
}: BeforeAfterImageProps) {
  return (
    <div
      className={[
        "relative isolate overflow-hidden bg-surface-muted",
        className,
      ].filter(Boolean).join(" ")}
      aria-label="نمایش قبل و بعد تصویر محصول"
    >
      <Image
        src={before.src}
        alt={before.alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover object-[50%_58%]"
      />
      <Image
        src={after.src}
        alt={after.alt}
        fill
        priority={priority}
        sizes={sizes}
        className="auth-before-after-reveal object-cover object-[52%_58%]"
      />
      <div className="auth-before-after-divider absolute inset-y-0 z-10 w-px bg-surface/85 shadow-[0_0_0_1px_rgba(23,20,17,0.12)]" />
      <span className="absolute right-3 top-3 z-10 rounded-full bg-surface/80 px-2.5 py-1 text-[10px] font-medium text-muted backdrop-blur">
        قبل
      </span>
      <span className="absolute left-3 top-3 z-10 rounded-full bg-foreground/80 px-2.5 py-1 text-[10px] font-medium text-surface backdrop-blur">
        بعد
      </span>
      <div className="absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-surface to-transparent" />
    </div>
  );
}
