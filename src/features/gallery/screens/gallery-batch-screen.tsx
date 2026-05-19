import Link from "next/link";
import { ArrowRight, Gallery, Magicpen } from "vuesax-icons-react";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { StatusPill } from "@/components/ui/status-pill";
import { ProjectStatusRefresh } from "@/features/projects/components/project-status-refresh";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";

export type GalleryBatchDetail = {
  id: string;
  title: string | null;
  status: string;
  style: { name: string };
  outputPreset: string;
  items: Array<{
    id: string;
    asset: { title: string | null; originalName: string | null; fileUrl: string };
    project: { id: string; status: string; title: string | null } | null;
  }>;
};

type GalleryBatchScreenProps = {
  batch: GalleryBatchDetail;
};

const statusLabelMap: Record<string, string> = {
  QUEUED: "در صف تولید",
  PROCESSING: "در حال تولید",
  COMPLETED: "آماده",
  FAILED: "ناموفق",
};

function statusVariant(status: string) {
  if (status === "COMPLETED") return "completed" as const;
  if (status === "FAILED") return "failed" as const;
  if (status === "QUEUED" || status === "PROCESSING") return "pending" as const;
  return "neutral" as const;
}

export function GalleryBatchScreen({ batch }: GalleryBatchScreenProps) {
  const activeCount = batch.items.filter((item) => item.project?.status === "QUEUED" || item.project?.status === "PROCESSING").length;
  const completedCount = batch.items.filter((item) => item.project?.status === "COMPLETED").length;
  const failedCount = batch.items.filter((item) => item.project?.status === "FAILED" || !item.project).length;
  const isActive = batch.status === "QUEUED" || batch.status === "PROCESSING";

  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-28">
      <ProjectStatusRefresh active={isActive} />

      <div className="flex items-center justify-between gap-3">
        <ButtonLink href="/gallery" variant="ghost" size="sm" className="w-fit">
          <ArrowRight aria-hidden={true} className="h-4 w-4" />
          گالری
        </ButtonLink>
        <ButtonLink href="/projects" variant="secondary" size="sm" className="w-fit">
          <Gallery aria-hidden={true} className="h-4 w-4" />
          پروژه‌ها
        </ButtonLink>
      </div>

      <section className="space-y-3 rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
              <Magicpen aria-hidden={true} className="h-4 w-4" />
              تولید گروهی
            </h2>
            <p className="text-sm leading-7 text-muted">
              {batch.items.length.toLocaleString("fa-IR")} تصویر با سبک {batch.style.name}
            </p>
          </div>
          <StatusPill variant={statusVariant(batch.status)}>{statusLabelMap[batch.status] ?? batch.status}</StatusPill>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[1rem] bg-surface-soft px-2 py-2">
            <p className="text-sm font-semibold text-foreground">{completedCount.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-[11px] text-muted">آماده</p>
          </div>
          <div className="rounded-[1rem] bg-surface-soft px-2 py-2">
            <p className="text-sm font-semibold text-foreground">{activeCount.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-[11px] text-muted">در جریان</p>
          </div>
          <div className="rounded-[1rem] bg-surface-soft px-2 py-2">
            <p className="text-sm font-semibold text-foreground">{failedCount.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-[11px] text-muted">نیازمند بررسی</p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        {batch.items.map((item) => {
          const title = item.project?.title || item.asset.title || item.asset.originalName || "تصویر محصول";
          const status = item.project?.status ?? "FAILED";
          const content = (
            <>
              <JewelryImageFrame aspect="square" className="h-16 w-16 shrink-0 rounded-[1rem]">
                <SafeJewelryImage
                  src={item.asset.fileUrl}
                  fallbackSrc={uploadPreview.src}
                  fallbackAlt={uploadPreview.alt}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </JewelryImageFrame>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted">یک پروژه جدا برای این عکس ساخته شده است</p>
              </div>
              <StatusPill variant={statusVariant(status)}>{statusLabelMap[status] ?? status}</StatusPill>
            </>
          );

          return item.project ? (
            <Link
              key={item.id}
              href={`/projects/${item.project.id}`}
              className="motion-press flex items-center gap-3 rounded-[1rem] border border-border/70 bg-surface px-3 py-3 text-right"
            >
              {content}
            </Link>
          ) : (
            <div key={item.id} className="flex items-center gap-3 rounded-[1rem] border border-border/70 bg-surface px-3 py-3 text-right">
              {content}
            </div>
          );
        })}
      </section>
    </PageShell>
  );
}
