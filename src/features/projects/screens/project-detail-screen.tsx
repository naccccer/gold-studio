import Image from "next/image";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { ProgressiveHint } from "@/components/ui/progressive-hint";
import { StatusPill } from "@/components/ui/status-pill";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { resultHeroDark, uploadPreview } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusConfig: Record<
  string,
  { label: string; variant: "pending" | "completed" | "failed" | "neutral"; supportCopy: string }
> = {
  PENDING: { label: "در حال آماده‌سازی", variant: "pending", supportCopy: "خروجی نهایی به‌زودی آماده می‌شود." },
  COMPLETED: { label: "آماده", variant: "completed", supportCopy: "استودیو خروجی نهایی را تحویل داده است." },
  FAILED: { label: "نیازمند بازبینی", variant: "failed", supportCopy: "تولید کامل نشد؛ می‌توانید پروژه تازه‌ای شروع کنید." },
};

export type ProjectDetail = {
  title: string | null;
  sourceImageUrl: string;
  resultImageUrl: string | null;
  status: string;
  stylePreset: StylePresetId;
  errorMessage: string | null;
};

type ProjectDetailScreenProps = { project: ProjectDetail };

export function ProjectDetailScreen({ project }: ProjectDetailScreenProps) {
  const status = statusConfig[project.status] ?? {
    label: project.status,
    variant: "neutral" as const,
    supportCopy: "وضعیت پروژه ثبت شد.",
  };
  const hasResult = Boolean(project.resultImageUrl);
  const resultImageSrc = project.resultImageUrl || resultHeroDark.src;
  const sourceImageSrc = project.sourceImageUrl || uploadPreview.src;

  return (
    <PageShell
      maxWidth="lg"
      className="space-y-6 rounded-[var(--radius-xl)] bg-foreground px-3 py-4 text-surface sm:px-5 sm:py-6"
    >
      <header className="flex items-start justify-between gap-4 px-1">
        <div className="space-y-1">
          <h2 className="font-display text-3xl leading-tight text-surface">بررسی نتیجه</h2>
          <p className="text-xs text-surface/60">
            {project.title || "پروژه بدون عنوان"} · {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}
          </p>
        </div>
        <StatusPill variant={status.variant} className="border-white/15 bg-white/[0.08] text-surface">
          {status.label}
        </StatusPill>
      </header>

      <section className="space-y-4">
        <JewelryImageFrame aspect="portrait" className="min-h-[540px] border-white/15 bg-black shadow-none">
          <Image
            src={resultImageSrc}
            alt={hasResult ? "خروجی نهایی پروژه" : resultHeroDark.alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 760px"
          />
          {!hasResult ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <p className="text-sm font-medium text-surface">
                {project.status === "FAILED" ? "خروجی نهایی آماده نشد." : "استودیو در حال آماده‌سازی تصویر است."}
              </p>
            </div>
          ) : null}
        </JewelryImageFrame>

        {project.errorMessage ? (
          <p className="rounded-[var(--radius-md)] border border-danger/40 bg-danger-soft px-3 py-2 text-xs text-danger">
            {project.errorMessage}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-[minmax(0,0.72fr)_minmax(260px,1fr)] md:items-end">
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-white/15">
            <Image
              src={sourceImageSrc}
              alt={project.sourceImageUrl ? "تصویر اولیه" : uploadPreview.alt}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-surface/55">تصویر اولیه</p>
            <p className="text-xs text-surface/70">{status.supportCopy}</p>
          </div>
        </div>

        <div className="space-y-2">
          {hasResult ? (
            <a href={project.resultImageUrl as string} download className={buttonClasses({ className: "h-12 w-full bg-accent text-accent-foreground hover:bg-accent-soft" })}>
              دانلود خروجی نهایی
            </a>
          ) : (
            <ProgressiveHint title="نتیجه" className="border-white/15 bg-white/[0.04] text-surface/70">
              <span>در همین قاب نمایش داده می‌شود.</span>
            </ProgressiveHint>
          )}
          <ButtonLink href="/projects/new" variant="secondary" className="w-full border-white/15 bg-white/[0.04] text-surface hover:bg-white/10">
            پروژه جدید
          </ButtonLink>
          <ButtonLink href="/projects" variant="ghost" className="w-full text-surface/70 hover:bg-white/10 hover:text-surface">
            بازگشت به آرشیو
          </ButtonLink>
        </div>
      </section>
    </PageShell>
  );
}
