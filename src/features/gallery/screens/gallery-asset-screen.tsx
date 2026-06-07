import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ImageFrame } from "@/components/ui/image-frame";

import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { AssetProductTypeForm } from "@/features/gallery/components/asset-product-type-form";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";

export type GalleryAssetDetail = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
  notes: string | null;
  productType: string | null;
  createdAt: Date;
  projects: Array<{
    id: string;
    title: string | null;
    status: string;
    resultImageUrl: string | null;
    sourceImageUrl: string;
    createdAt: Date;
  }>;
};

type GalleryAssetScreenProps = {
  asset: GalleryAssetDetail;
};

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" });
const statusLabelMap: Record<string, string> = {
  QUEUED: "در صف",
  PROCESSING: "در حال ساخت",
  COMPLETED: "آماده",
  FAILED: "نیازمند تکرار",
};

export function GalleryAssetScreen({ asset }: GalleryAssetScreenProps) {
  const title = asset.title || asset.originalName || "تصویر محصول";

  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-4">
      <ImageFrame aspect="portrait" className="rounded-[1.25rem] bg-surface-soft shadow-none">
        <SafeJewelryImage
          src={asset.fileUrl}
          alt={title}
          fallbackSrc={uploadPreview.src}
          fallbackAlt={uploadPreview.alt}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 760px"
        />
      </ImageFrame>

      <section className="space-y-3 rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-xs text-muted">{dateFormatter.format(asset.createdAt)}</p>
          </div>
          <ButtonLink href={`/projects/new?assetId=${asset.id}`} size="sm">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            تولید
          </ButtonLink>
        </div>
        {asset.notes ? <p className="text-sm leading-7 text-muted">{asset.notes}</p> : null}
        <AssetProductTypeForm assetId={asset.id} productType={asset.productType} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">خروجی‌های ساخته‌شده</h2>
        {asset.projects.length === 0 ? (
          <p className="rounded-[1rem] border border-border/70 bg-surface px-4 py-4 text-sm text-muted">
            هنوز خروجی‌ای از این تصویر ساخته نشده است.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {asset.projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block">
                <div className="relative h-[136px] overflow-hidden rounded-[1rem] border border-white/75 bg-[#ebe2d6] transition group-hover:border-border-strong">
                  <SafeJewelryImage
                    src={project.resultImageUrl || project.sourceImageUrl}
                    alt={project.title || "خروجی محصول"}
                    fallbackSrc={uploadPreview.src}
                    fallbackAlt={uploadPreview.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 240px"
                  />
                  <span className="absolute right-2 top-2 rounded-full bg-black/48 px-2.5 py-1 text-[10px] text-surface backdrop-blur">
                    {statusLabelMap[project.status] ?? project.status}
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-full bg-surface/84 px-2 py-0.5 text-[10px] font-medium text-muted backdrop-blur">
                    {dateFormatter.format(project.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
