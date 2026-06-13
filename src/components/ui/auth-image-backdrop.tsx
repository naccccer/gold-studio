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
    <div className={["absolute inset-0 overflow-hidden bg-[#f4eee5]", className].filter(Boolean).join(" ")}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={75}
        sizes="(max-width: 640px) 100vw, 430px"
        className={["object-cover", imageClassName].filter(Boolean).join(" ")}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,238,229,0.2)_0%,rgba(244,238,229,0)_34%,rgba(244,238,229,0.86)_74%,rgba(244,238,229,0.98)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-[#f4eee5] via-[#f4eee5]/92 to-transparent" />
    </div>
  );
}
