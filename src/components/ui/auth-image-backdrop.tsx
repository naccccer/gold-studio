import Image from "next/image";
import type { StaticImageData } from "next/image";

type AuthImageBackdropProps = {
  src: string | StaticImageData;
  alt?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export function AuthImageBackdrop({
  src,
  alt = "",
  priority = false,
  className = "",
  imageClassName = "object-[50%_52%]",
}: AuthImageBackdropProps) {
  return (
    <div className={["absolute inset-0 overflow-hidden bg-[#11100e]", className].filter(Boolean).join(" ")}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={94}
        sizes="(max-width: 640px) 100vw, 420px"
        className={["object-cover", imageClassName].filter(Boolean).join(" ")}
      />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#11100e]/58 via-[#11100e]/18 to-transparent" />
    </div>
  );
}
