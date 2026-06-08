import Link from "next/link";
import { Images } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { StatusPill } from "@/components/ui/status-pill";
import { Pill } from "@/components/ui/pill";
import { ImageFrame } from "@/components/ui/image-frame";
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
    <div className="relative isolate flex min-h-0 w-full flex-1 flex-col bg-ink-1 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(212,184,134,0.10),transparent_55%)]"
      />
    <PageShell maxWidth="lg" minHeight={false} className="flex-1 space-y-5 overflow-y-auto pb-6 text-white">
      <ProjectStatusRefresh active={isActive} />

      <div className="flex items-center justify-between gap-3">
        <ButtonLink href="/gallery" variant="secondary" size="sm" className="w-fit rounded-full">
          گالری
        </ButtonLink>
        <ButtonLink href="/projects" variant="secondary" size="sm" className="w-fit rounded-full">
          <Images aria-hidden={true} className="h-4 w-4" />
          پروژه‌ها
        </ButtonLink>
      </div>

      <section className="space-y-3 rounded-[var(--r-xl)] border border-white/12 bg-white/[0.05] px-4 py-3.5 text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-7 text-white">
            {batch.items.length.toLocaleString("fa-IR")} تصویر با سبک {batch.style.name}
          </p>
          <Pill tone="champagne">{statusLabelMap[batch.status] ?? batch.status}</Pill>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[var(--r-lg)] border border-white/10 bg-white/[0.05] px-2 py-2">
            <p className="text-sm font-semibold text-white">{completedCount.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-[11px] text-white/65">آماده</p>
          </div>
          <div className="rounded-[var(--r-lg)] border border-white/10 bg-white/[0.05] px-2 py-2">
            <p className="text-sm font-semibold text-white">{activeCount.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-[11px] text-white/65">در جریان</p>
          </div>
          <div className="rounded-[var(--r-lg)] border border-white/10 bg-white/[0.05] px-2 py-2">
            <p className="text-sm font-semibold text-white">{failedCount.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-[11px] text-white/65">نیازمند بررسی</p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        {batch.items.map((item) => {
          const title = item.project?.title || item.asset.title || item.asset.originalName || "تصویر محصول";
          const status = item.project?.status ?? "FAILED";
          const content = (
            <>
              <ImageFrame aspect="square" className="h-16 w-16 shrink-0 rounded-[var(--r-lg)]">
                <SafeJewelryImage
                  src={item.asset.fileUrl}
                  fallbackSrc={uploadPreview.src}
                  fallbackAlt={uploadPreview.alt}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </ImageFrame>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-white/65">یک پروژه جدا برای این عکس ساخته شده است</p>
              </div>
              <StatusPill variant={statusVariant(status)}>{statusLabelMap[status] ?? status}</StatusPill>
            </>
          );

          return item.project ? (
            <Link
              key={item.id}
              href={`/projects/${item.project.id}?fromBatch=${batch.id}`}
              className="ov-press flex items-center gap-3 rounded-[var(--r-lg)] border border-white/12 bg-white/[0.05] px-3 py-3 text-right text-white transition hover:bg-white/[0.08]"
            >
              {content}
            </Link>
          ) : (
            <div key={item.id} className="flex items-center gap-3 rounded-[var(--r-lg)] border border-white/12 bg-white/[0.05] px-3 py-3 text-right text-white">
              {content}
            </div>
          );
        })}
      </section>
    </PageShell>
    </div>
  );
}
