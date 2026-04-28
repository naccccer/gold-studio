import Image from "next/image";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusConfig: Record<
  string,
  { label: string; variant: "pending" | "completed" | "failed" | "neutral"; supportCopy: string }
> = {
  PENDING: {
    label: "در حال تولید",
    variant: "pending",
    supportCopy: "استودیو در حال آماده‌سازی خروجی نهایی است. کمی بعد دوباره بررسی کنید.",
  },
  COMPLETED: {
    label: "آماده دانلود",
    variant: "completed",
    supportCopy: "خروجی نهایی آماده است. کیفیت تصویر را بررسی کنید و دانلود بگیرید.",
  },
  FAILED: {
    label: "نیاز به اقدام",
    variant: "failed",
    supportCopy: "تولید این خروجی کامل نشده است. می‌توانید پروژه جدیدی با تصویر بهتر شروع کنید.",
  },
};

export type ProjectDetail = {
  title: string | null;
  sourceImageUrl: string;
  resultImageUrl: string | null;
  status: string;
  stylePreset: StylePresetId;
  errorMessage: string | null;
};

type ProjectDetailScreenProps = {
  project: ProjectDetail;
};

export function ProjectDetailScreen({ project }: ProjectDetailScreenProps) {
  const status = statusConfig[project.status] ?? {
    label: project.status,
    variant: "neutral" as const,
    supportCopy: "وضعیت پروژه ثبت شد.",
  };

  const hasResult = Boolean(project.resultImageUrl);

  return (
    <PageShell maxWidth="lg" className="space-y-6 sm:space-y-8">
      <Surface padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {project.title || "اتاق بررسی خروجی"}
            </h2>
            <p className="text-sm text-muted">{status.supportCopy}</p>
          </div>
          <StatusPill variant={status.variant}>{status.label}</StatusPill>
        </div>

        <p className="text-sm text-muted">سبک انتخابی: {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</p>

        {project.errorMessage ? (
          <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {project.errorMessage}
          </p>
        ) : null}
      </Surface>

      <Surface padding="lg" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">خروجی نهایی</h3>
          <p className="text-sm text-muted">تصویر تولید شده را در اندازه بزرگ بررسی کنید.</p>
        </div>

        {hasResult ? (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-soft p-2 sm:p-3">
            <Image
              src={project.resultImageUrl as string}
              alt="خروجی نهایی پروژه"
              width={1400}
              height={1400}
              className="h-auto w-full rounded-[var(--radius-md)] border border-border object-cover"
            />
          </div>
        ) : project.status === "FAILED" ? (
          <div className="rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft px-4 py-10 text-center">
            <p className="text-base font-medium text-danger">تولید خروجی با خطا متوقف شد.</p>
            <p className="mt-2 text-sm text-danger">می‌توانید با تصویر یا سبک دیگر پروژه جدید بسازید.</p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface-soft px-4 py-10 text-center">
            <p className="text-base font-medium text-foreground">خروجی هنوز آماده نیست.</p>
            <p className="mt-2 text-sm text-muted">این صفحه را کمی بعد دوباره باز کنید تا تصویر نهایی نمایش داده شود.</p>
          </div>
        )}
      </Surface>

      <div className="grid gap-4 sm:grid-cols-3">
        <Surface padding="md" className="space-y-3 sm:col-span-1">
          <p className="text-sm font-medium text-foreground">تصویر اولیه</p>
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-soft p-2">
            <Image
              src={project.sourceImageUrl}
              alt="تصویر اولیه محصول"
              width={900}
              height={900}
              className="h-auto w-full rounded-[var(--radius-sm)] border border-border object-cover"
            />
          </div>
        </Surface>

        <Surface padding="md" className="space-y-3 sm:col-span-2">
          <p className="text-sm font-medium text-foreground">اقدام بعدی</p>
          <p className="text-sm text-muted">بعد از بررسی، می‌توانید خروجی را دانلود کنید یا تولید جدید شروع کنید.</p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {hasResult ? (
              <a href={project.resultImageUrl as string} download className={buttonClasses({ className: "w-full sm:w-auto" })}>
                دانلود تصویر نهایی
              </a>
            ) : null}

            <ButtonLink href="/projects/new" variant="secondary" className="w-full sm:w-auto">
              شروع پروژه جدید
            </ButtonLink>
            <ButtonLink href="/projects" variant="ghost" className="w-full sm:w-auto">
              بازگشت به آرشیو پروژه‌ها
            </ButtonLink>
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
