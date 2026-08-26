import Image from "next/image";

export function AdminImagePreview({
  thumbnailSrc,
  originalSrc,
  alt,
  sizes,
  className = "",
  imageClassName = "object-cover",
  detailHref,
}: {
  thumbnailSrc: string;
  originalSrc: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  detailHref?: string | null;
}) {
  return (
    <button
      type="button"
      data-admin-image-preview
      data-admin-image-preview-src={originalSrc}
      data-admin-image-preview-label={alt || "تصویر"}
      data-admin-image-preview-detail-href={detailHref || undefined}
      className={`relative block overflow-hidden text-right [touch-action:manipulation] ${className}`}
      aria-label={`نمایش کامل ${alt || "تصویر"}`}
    >
      <Image src={thumbnailSrc} alt={alt} fill unoptimized className={imageClassName} sizes={sizes} />
    </button>
  );
}
