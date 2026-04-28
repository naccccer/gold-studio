import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusLabelMap: Record<string, string> = {
  PENDING: "در حال تولید",
  COMPLETED: "آماده",
  FAILED: "نیاز به بررسی",
};

export type DashboardRecentProject = {
  id: string;
  title: string | null;
  status: string;
  stylePreset: StylePresetId;
  sourceImageUrl: string;
  createdAt: Date;
};

type DashboardHomeScreenProps = {
  userName?: string | null;
  projectCount: number;
  completedCount: number;
  recentProjects: DashboardRecentProject[];
};

const persianDateFormatter = new Intl.DateTimeFormat("fa-IR", {
  day: "numeric",
  month: "long",
});

export function DashboardHomeScreen({
  userName,
  projectCount,
  completedCount,
  recentProjects,
}: DashboardHomeScreenProps) {
  return (
    <PageShell maxWidth="lg" className="space-y-6 sm:space-y-8">
      <Surface padding="lg" className="space-y-5 sm:space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-muted">استودیو شما آماده است</p>
          <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            سلام {userName || "دوست عزیز"}،
            <br />
            تصویر بعدی برندت را همین‌جا بساز.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
            عکس خام محصول را آپلود کن، سبک را انتخاب کن و خروجی آماده فروش تحویل بگیر.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/projects/new" className="w-full sm:w-auto">
            شروع پروژه جدید
          </ButtonLink>
          <ButtonLink href="/projects" variant="secondary" className="w-full sm:w-auto">
            مشاهده آرشیو پروژه‌ها
          </ButtonLink>
        </div>
      </Surface>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground sm:text-lg">پروژه‌های اخیر</h3>
            <p className="text-sm text-muted">آخرین کارهای استودیو برای ادامه سریع.</p>
          </div>
          <p className="text-xs text-muted sm:text-sm">
            {projectCount} پروژه · {completedCount} خروجی آماده
          </p>
        </div>

        {recentProjects.length === 0 ? (
          <Surface padding="lg" className="space-y-4 text-center sm:py-10">
            <p className="text-lg font-medium text-foreground">هنوز پروژه‌ای ثبت نشده است.</p>
            <p className="mx-auto max-w-md text-sm text-muted">
              اولین عکس محصولت را وارد کن تا گالری استودیویی برندت شکل بگیرد.
            </p>
            <div className="pt-1">
              <ButtonLink href="/projects/new" size="sm">
                ساخت اولین پروژه
              </ButtonLink>
            </div>
          </Surface>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {recentProjects.map((project) => (
              <Surface
                key={project.id}
                as="article"
                padding="md"
                className="overflow-hidden transition-colors hover:border-border-strong"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="w-full shrink-0 sm:w-40">
                    <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-soft">
                      <Image
                        src={project.sourceImageUrl}
                        alt={project.title || "پیش‌نمایش پروژه"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 160px"
                      />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-semibold text-foreground">
                        {project.title || "پروژه بدون عنوان"}
                      </p>
                      <StatusPill>{statusLabelMap[project.status] ?? project.status}</StatusPill>
                    </div>

                    <div className="space-y-1 text-sm text-muted">
                      <p>سبک: {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</p>
                      <p>ثبت: {persianDateFormatter.format(project.createdAt)}</p>
                    </div>

                    <div>
                      <ButtonLink href={`/projects/${project.id}`} size="sm" variant="secondary">
                        ادامه بررسی پروژه
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
