import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";

export type GalleryBatchDetail = {
  id: string;
  title: string | null;
  status: string;
  stylePreset: StylePresetId;
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

const styleLabelMap = new Map(STYLE_PRESETS.map((style) => [style.id, style.label]));

export function GalleryBatchScreen({ batch }: GalleryBatchScreenProps) {
  return (
    <PageShell maxWidth="md" className="space-y-5 pb-4">
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
          {batch.items.length.toLocaleString("fa-IR")} تصویر با سبک {styleLabelMap.get(batch.stylePreset) ?? batch.stylePreset} ثبت شد.
        </p>
        <p className="text-xs text-muted">وضعیت: {batch.status}</p>
      </section>

      <section className="space-y-2">
        {batch.items.map((item) => {
          const title = item.asset.title || item.asset.originalName || "تصویر محصول";
          return item.project ? (
            <Link key={item.id} href={`/projects/${item.project.id}`} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 py-3 text-sm">
              <span className="truncate">{title}</span>
              <span className="text-xs text-muted">{item.project.status}</span>
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
