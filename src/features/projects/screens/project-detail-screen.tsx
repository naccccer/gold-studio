import Image from "next/image";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { ProgressiveHint } from "@/components/ui/progressive-hint";
import { StatusPill } from "@/components/ui/status-pill";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { resultHeroDark, uploadPreview } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusConfig: Record<string, { label: string; variant: "pending" | "completed" | "failed" | "neutral"; supportCopy: string }> = {
  PENDING: { label: "در حال تولید", variant: "pending", supportCopy: "خروجی در حال آماده‌سازی است." },
  COMPLETED: { label: "آماده دانلود", variant: "completed", supportCopy: "تصویر نهایی آماده استفاده است." },
  FAILED: { label: "نیاز به اقدام", variant: "failed", supportCopy: "تولید کامل نشد. می‌توانید دوباره تلاش کنید." },
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
  const status = statusConfig[project.status] ?? { label: project.status, variant: "neutral" as const, supportCopy: "وضعیت پروژه ثبت شد." };
  const hasResult = Boolean(project.resultImageUrl);
  const resultImageSrc = project.resultImageUrl || resultHeroDark.src;
  const sourceImageSrc = project.sourceImageUrl || uploadPreview.src;

  return (
    <PageShell maxWidth="lg" className="space-y-6 bg-foreground px-3 py-4 text-surface sm:rounded-[var(--radius-xl)] sm:px-5 sm:py-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl text-surface">اتاق خروجی</h2>
          <StatusPill variant={status.variant}>{status.label}</StatusPill>
        </div>
        <p className="text-sm text-surface/75">{project.title || "پروژه بدون عنوان"} · {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</p>
      </header>

      <section className="space-y-3">
        <JewelryImageFrame aspect="portrait" className="border-white/20 bg-black/30">
          <Image src={resultImageSrc} alt={hasResult ? "خروجی نهایی پروژه" : resultHeroDark.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 760px" />
          {!hasResult ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-sm text-surface/85">
              {project.status === "FAILED" ? "تولید خروجی متوقف شد." : "در حال آماده‌سازی تصویر نهایی..."}
            </div>
          ) : null}
        </JewelryImageFrame>

        {project.errorMessage ? <p className="rounded-[var(--radius-md)] border border-danger/40 bg-danger-soft px-3 py-2 text-xs text-danger">{project.errorMessage}</p> : null}
      </section>

      <section className="space-y-3">
        <ProgressiveHint title="منبع" className="border-white/20 bg-white/5 text-surface/80"><span>در صورت نیاز تصویر اولیه را هم بررسی کنید.</span></ProgressiveHint>
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-[var(--radius-md)] border border-white/20">
            <Image src={sourceImageSrc} alt={project.sourceImageUrl ? "تصویر اولیه" : uploadPreview.alt} fill className="object-cover" sizes="64px" />
          </div>
          <p className="text-xs text-surface/70">{status.supportCopy}</p>
        </div>
      </section>

      <section className="space-y-2">
        {hasResult ? <a href={project.resultImageUrl as string} download className={buttonClasses({ className: "w-full" })}>دانلود تصویر نهایی</a> : null}
        <ButtonLink href="/projects/new" variant="secondary" className="w-full">پروژه جدید</ButtonLink>
        <ButtonLink href="/projects" variant="ghost" className="w-full text-surface/90 hover:text-surface">بازگشت به آرشیو</ButtonLink>
      </section>
    </PageShell>
  );
}
