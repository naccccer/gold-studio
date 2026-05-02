import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";

export type GalleryAssetDetail = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
  notes: string | null;
  createdAt: Date;
  projects: Array<{
    id: string;
    title: string | null;
    status: string;
  }>;
};

type GalleryAssetScreenProps = {
  asset: GalleryAssetDetail;
};

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" });

export function GalleryAssetScreen({ asset }: GalleryAssetScreenProps) {
  const title = asset.title || asset.originalName || "تصویر محصول";

  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-4">
      <ButtonLink href="/gallery" variant="ghost" size="sm" className="w-fit">
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
        بازگشت به گالری
      </ButtonLink>

      <JewelryImageFrame aspect="portrait" className="rounded-[1.25rem] bg-surface-soft shadow-none">
        <Image src={asset.fileUrl} alt={title} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 760px" />
      </JewelryImageFrame>

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
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">خروجی‌های ساخته‌شده</h2>
        {asset.projects.length === 0 ? (
          <p className="rounded-[1rem] border border-border/70 bg-surface px-4 py-4 text-sm text-muted">هنوز خروجی‌ای از این تصویر ساخته نشده است.</p>
        ) : (
          <div className="space-y-2">
            {asset.projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 py-3 text-sm">
                <span className="truncate">{project.title || "خروجی محصول"}</span>
                <span className="text-xs text-muted">{project.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
