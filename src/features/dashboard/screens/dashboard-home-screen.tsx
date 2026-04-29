import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { ProgressiveHint } from "@/components/ui/progressive-hint";
import { StatusPill } from "@/components/ui/status-pill";
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
  month: "short",
});

export function DashboardHomeScreen({ userName, recentProjects }: DashboardHomeScreenProps) {
  const heroProject = recentProjects[0];

  return (
    <PageShell maxWidth="lg" className="space-y-8 sm:space-y-10">
      <section className="space-y-5 pt-2 sm:pt-4">
        <div className="space-y-3">
          <h2 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">استودیو تصویر طلا</h2>
          <p className="text-sm text-muted">سلام {userName || "دوست عزیز"}، پروژه بعدی را همین حالا شروع کنید.</p>
        </div>

        <JewelryImageFrame aspect="portrait" className="bg-surface-soft">
          {heroProject ? (
            <Image src={heroProject.sourceImageUrl} alt={heroProject.title || "پروژه اخیر"} fill className="object-cover" sizes="(max-width: 768px) 100vw, 540px" />
          ) : (
            <div className="flex h-full items-end bg-gradient-to-b from-surface to-surface-soft p-5">
              <div className="space-y-2">
                <p className="text-base font-medium text-foreground">اولین تصویر محصولت را بساز</p>
                <p className="text-xs text-muted">پس‌زمینه ساده، نور تمیز، خروجی حرفه‌ای.</p>
              </div>
            </div>
          )}
        </JewelryImageFrame>

        <div className="flex flex-col gap-3">
          <ButtonLink href="/projects/new" className="w-full">شروع پروژه جدید</ButtonLink>
          <ButtonLink href="/projects" variant="ghost" className="w-full">آرشیو پروژه‌ها</ButtonLink>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-sm text-muted">پروژه‌های اخیر</h3>
          <ProgressiveHint title="راهنما">برای مشاهده خروجی نهایی، روی هر تصویر بزنید.</ProgressiveHint>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {recentProjects.slice(0, 3).map((project) => (
            <a key={project.id} href={`/projects/${project.id}`} className="space-y-2">
              <JewelryImageFrame className="border-border/80">
                <Image src={project.sourceImageUrl} alt={project.title || "پروژه"} fill className="object-cover" sizes="(max-width: 640px) 100vw, 280px" />
              </JewelryImageFrame>
              <div className="space-y-1 px-1">
                <p className="truncate text-sm font-medium text-foreground">{project.title || "پروژه بدون عنوان"}</p>
                <div className="flex items-center justify-between gap-2 text-xs text-muted">
                  <span>{styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</span>
                  <span>{persianDateFormatter.format(project.createdAt)}</span>
                </div>
                <StatusPill>{statusLabelMap[project.status] ?? project.status}</StatusPill>
              </div>
            </a>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
