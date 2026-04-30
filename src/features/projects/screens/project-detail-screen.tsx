import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { resultHeroDark, uploadPreview } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusConfig: Record<
  string,
  { label: string; supportCopy: string; actionLabel: string }
> = {
  PENDING: {
    label: "در حال آماده‌سازی",
    supportCopy: "خروجی نهایی در همین قاب ظاهر می‌شود.",
    actionLabel: "در انتظار خروجی",
  },
  COMPLETED: {
    label: "آماده",
    supportCopy: "استودیو خروجی نهایی را تحویل داده است.",
    actionLabel: "دانلود تصویر",
  },
  FAILED: {
    label: "نیازمند بازبینی",
    supportCopy: "تولید کامل نشد؛ می‌توانید دوباره شروع کنید.",
    actionLabel: "خروجی آماده نیست",
  },
};

export type ProjectDetail = {
  title: string | null;
  sourceImageUrl: string;
  resultImageUrl: string | null;
  status: string;
  stylePreset: StylePresetId;
  errorMessage: string | null;
  createdAt?: Date;
};

type ProjectDetailScreenProps = { project: ProjectDetail };

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

export function ProjectDetailScreen({ project }: ProjectDetailScreenProps) {
  const status = statusConfig[project.status] ?? {
    label: "ثبت شده",
    supportCopy: "وضعیت پروژه ثبت شد.",
    actionLabel: "خروجی نهایی",
  };
  const hasResult = Boolean(project.resultImageUrl);
  const resultImageSrc = project.resultImageUrl || resultHeroDark.src;
  const sourceImageSrc = project.sourceImageUrl || uploadPreview.src;
  const styleLabel = styleLabelMap.get(project.stylePreset) ?? "سبک انتخابی";
  const projectDate = project.createdAt ? dateFormatter.format(project.createdAt) : null;

  return (
    <PageShell
      maxWidth="lg"
      className="min-h-[calc(100vh-2rem)] space-y-4 rounded-[1.65rem] bg-[#11100e] px-3 py-4 pb-24 text-surface sm:px-5 sm:py-5"
    >
      <header className="flex items-center justify-between gap-4 px-1">
        <ButtonLink
          href="/projects"
          variant="ghost"
          size="sm"
          className="h-9 px-2.5 text-xs text-surface/62 hover:bg-white/10 hover:text-surface"
        >
          آرشیو
        </ButtonLink>
        <p className="text-xs font-medium text-surface/72">بررسی نتیجه</p>
        <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] text-surface/70">
          {status.label}
        </span>
      </header>

      <section className="space-y-3">
        <JewelryImageFrame
          aspect="portrait"
          className="rounded-[1.4rem] border-white/12 bg-black shadow-[0_34px_82px_-58px_rgba(0,0,0,0.95)] sm:min-h-[620px]"
        >
          <SafeJewelryImage
            src={resultImageSrc}
            fallbackSrc={resultHeroDark.src}
            fallbackAlt={resultHeroDark.alt}
            alt={hasResult ? "خروجی نهایی پروژه" : resultHeroDark.alt}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 760px"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 via-black/24 to-transparent p-5">
            <div className="space-y-2">
              <h2 className="text-lg font-medium leading-8 text-surface">
                {hasResult ? "خروجی نهایی" : project.status === "FAILED" ? "نیازمند بازبینی" : "در حال آماده‌سازی"}
              </h2>
              <p className="text-xs leading-6 text-surface/68">{status.supportCopy}</p>
            </div>
          </div>
        </JewelryImageFrame>

        <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-surface/50">
          <span>{styleLabel}</span>
          {projectDate ? <span>{projectDate}</span> : null}
        </div>
      </section>

      <section className="space-y-4 md:grid md:grid-cols-[minmax(0,0.6fr)_minmax(320px,0.8fr)] md:items-end md:gap-4 md:space-y-0">
        <div className="flex items-center gap-3 border-t border-white/10 pt-3">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-white/12 bg-white/[0.04]">
            <SafeJewelryImage
              src={sourceImageSrc}
              fallbackSrc={uploadPreview.src}
              fallbackAlt={uploadPreview.alt}
              alt={project.sourceImageUrl ? "تصویر اولیه" : uploadPreview.alt}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-surface/72">تصویر اولیه</p>
            <p className="truncate text-[11px] text-surface/45">{project.title || styleLabel}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {hasResult ? (
            <a
              href={project.resultImageUrl as string}
              download
              className={buttonClasses({
                className:
                  "h-12 w-full border border-[#d2ad72] bg-[#c69a5b] text-[13px] text-[#16110c] shadow-[0_20px_42px_-30px_rgba(198,154,91,0.9)] hover:bg-[#d6b174]",
              })}
            >
              دانلود تصویر
            </a>
          ) : (
            <span className="flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border border-white/12 bg-white/[0.05] text-[13px] font-medium text-surface/42">
              {status.actionLabel}
            </span>
          )}
          <ButtonLink
            href="/projects/new"
            variant="secondary"
            className="h-11 w-full border-white/12 bg-white/[0.05] text-[13px] text-surface hover:bg-white/10"
          >
            پروژه جدید
          </ButtonLink>
        </div>
      </section>

      {project.status === "FAILED" && project.errorMessage ? (
        <p className="border-t border-white/10 pt-3 text-xs leading-6 text-surface/42">
          تولید کامل نشد. برای نتیجه بهتر، تصویر واضح‌تری انتخاب کنید.
        </p>
      ) : null}
    </PageShell>
  );
}
