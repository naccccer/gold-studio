import { ArrowRight, Download, Images, Plus, RotateCcw } from "lucide-react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { resultHeroDark, uploadPreview } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusConfig: Record<
  string,
  { label: string; supportCopy: string; actionLabel: string; heroTitle: string }
> = {
  PENDING: {
    label: "در حال آماده‌سازی",
    supportCopy: "خروجی نهایی به‌زودی در همین صفحه آماده می‌شود.",
    actionLabel: "در انتظار خروجی",
    heroTitle: "تصویر در حال آماده‌سازی است",
  },
  COMPLETED: {
    label: "آماده",
    supportCopy: "خروجی نهایی آماده بررسی، مقایسه و دانلود است.",
    actionLabel: "دانلود تصویر",
    heroTitle: "خروجی نهایی",
  },
  FAILED: {
    label: "نیازمند تکرار",
    supportCopy: "تولید کامل نشد. با همان مسیر ساده می‌توانید دوباره تلاش کنید.",
    actionLabel: "تلاش دوباره",
    heroTitle: "تولید نیازمند تکرار است",
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

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" });

export function ProjectDetailScreen({ project }: ProjectDetailScreenProps) {
  const status = statusConfig[project.status] ?? {
    label: "ثبت شده",
    supportCopy: "وضعیت پروژه ثبت شد.",
    actionLabel: "خروجی نهایی",
    heroTitle: "پروژه ثبت شد",
  };
  const hasResult = Boolean(project.resultImageUrl);
  const isFailed = project.status === "FAILED";
  const resultImageSrc = project.resultImageUrl || resultHeroDark.src;
  const sourceImageSrc = project.sourceImageUrl || uploadPreview.src;
  const styleLabel = styleLabelMap.get(project.stylePreset) ?? "سبک انتخابی";
  const projectDate = project.createdAt ? dateFormatter.format(project.createdAt) : null;

  return (
    <PageShell maxWidth="lg" className="space-y-4 pb-4 text-surface">
      <header className="flex items-center justify-between px-0.5">
        <ButtonLink href="/projects" variant="ghost" size="sm" className="h-9 px-2 text-xs text-surface/65 hover:bg-white/[0.08] hover:text-surface">
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
          بازگشت
        </ButtonLink>
        <span className="text-[11px] text-surface/42">بررسی نتیجه</span>
      </header>

      <section className="space-y-3">
        <JewelryImageFrame
          aspect="portrait"
          className="rounded-[1.35rem] border border-white/12 bg-black shadow-[0_38px_100px_-64px_rgba(0,0,0,1)] sm:min-h-[640px]"
        >
          <SafeJewelryImage
            src={resultImageSrc}
            fallbackSrc={resultHeroDark.src}
            fallbackAlt={resultHeroDark.alt}
            alt={hasResult ? project.title || "خروجی نهایی محصول" : resultHeroDark.alt}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 760px"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/16 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-5">
            <p className="inline-flex w-fit rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] text-surface/72">
              {status.label}
            </p>
            <h1 className="text-xl font-semibold text-surface">{status.heroTitle}</h1>
            <p className="max-w-[34ch] text-xs leading-6 text-surface/64">{status.supportCopy}</p>
          </div>
        </JewelryImageFrame>

        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[11px] text-surface/55">
          <span>{styleLabel}</span>
          {projectDate ? <span>{projectDate}</span> : null}
        </div>
      </section>

      <section className="grid gap-3 rounded-[1rem] border border-white/10 bg-white/[0.04] p-3 sm:grid-cols-[0.65fr_1fr]">
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[0.8rem] border border-white/12 bg-white/[0.04]">
            <SafeJewelryImage
              src={sourceImageSrc}
              fallbackSrc={uploadPreview.src}
              fallbackAlt={uploadPreview.alt}
              alt="تصویر اولیه"
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="inline-flex items-center gap-1.5 text-[11px] text-surface/45">
              <Images aria-hidden="true" className="h-3.5 w-3.5" />
              قبل و بعد
            </p>
            <p className="truncate text-xs text-surface/70">{project.title || "تصویر ورودی پروژه"}</p>
          </div>
        </div>
        <p className="text-xs leading-6 text-surface/55">
          تصویر اولیه برای مقایسه کنار نتیجه نگه داشته شده است. خروجی نهایی باید همچنان هویت، فرم و جزئیات محصول را حفظ کند.
        </p>
      </section>

      <section className="space-y-2.5">
        {hasResult ? (
          <a
            href={project.resultImageUrl as string}
            download
            className={buttonClasses({
              className:
                "h-12 w-full border border-[#ddbc85] bg-[#d3ad74] text-[13px] text-[#16110c] shadow-[0_22px_42px_-32px_rgba(211,173,116,0.95)] hover:bg-[#e0bf8b]",
            })}
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            دانلود تصویر
          </a>
        ) : isFailed ? (
          <ButtonLink href="/projects/new" className="h-12 w-full text-[13px]">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            تلاش دوباره
          </ButtonLink>
        ) : (
          <span className="flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] text-[13px] font-medium text-surface/50">
            {status.actionLabel}
          </span>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ButtonLink href="/projects/new" variant="secondary" className="h-11 w-full border-white/10 bg-white/[0.05] text-[13px] text-surface hover:bg-white/[0.11]">
            <Plus aria-hidden="true" className="h-4 w-4" />
            پروژه جدید
          </ButtonLink>
          <ButtonLink href="/projects" variant="ghost" className="h-11 w-full border border-white/10 bg-transparent text-[13px] text-surface/80 hover:bg-white/[0.06] hover:text-surface">
            <Images aria-hidden="true" className="h-4 w-4" />
            پروژه‌ها
          </ButtonLink>
        </div>
      </section>
    </PageShell>
  );
}
