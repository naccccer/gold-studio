import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { ProjectStatusRefresh } from "@/features/projects/components/project-status-refresh";

export type GalleryBatchDetail = {
  id: string;
  title: string | null;
  status: string;
  style: { name: string };
  outputPreset: string;
  items: Array<{
    id: string;
    asset: { title: string | null; originalName: string | null };
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
  FAILED: "نیازمند تکرار",
};

export function GalleryBatchScreen({ batch }: GalleryBatchScreenProps) {
  const isActive = batch.status === "QUEUED" || batch.status === "PROCESSING";

  return (
    <PageShell maxWidth="md" className="space-y-5 pb-4">
      <ProjectStatusRefresh active={isActive} />

      <ButtonLink href="/gallery" variant="ghost" size="sm" className="w-fit">
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
        بازگشت به گالری
      </ButtonLink>

      <section className="space-y-2 rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <Layers3 aria-hidden="true" className="h-4 w-4" />
          تولید دسته‌ای
        </h2>
        <p className="text-sm leading-7 text-muted">
          {batch.items.length.toLocaleString("fa-IR")} تصویر با سبک {batch.style.name} ثبت شد.
        </p>
        <p className="text-xs text-muted">وضعیت: {statusLabelMap[batch.status] ?? batch.status}</p>
      </section>

      <section className="space-y-2">
        {batch.items.map((item) => {
          const title = item.asset.title || item.asset.originalName || "تصویر محصول";
          return item.project ? (
            <Link key={item.id} href={`/projects/${item.project.id}`} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 py-3 text-sm">
              <span className="truncate">{title}</span>
              <span className="text-xs text-muted">{statusLabelMap[item.project.status] ?? item.project.status}</span>
            </Link>
          ) : (
            <div key={item.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 py-3 text-sm">
              <span className="truncate">{title}</span>
              <span className="text-xs text-muted">ثبت نشده</span>
            </div>
          );
        })}
      </section>
    </PageShell>
  );
}
