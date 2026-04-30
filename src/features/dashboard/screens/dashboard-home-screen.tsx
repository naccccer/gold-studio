import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { ProgressiveHint } from "@/components/ui/progressive-hint";
import { StatusPill } from "@/components/ui/status-pill";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { archiveItems, extras, homeHero } from "@/lib/placeholders/jewelry-images";

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
  const previewImages = [...archiveItems.slice(0, 2), ...extras.slice(0, 1)];

  return (
    <PageShell maxWidth="lg" className="space-y-8 sm:space-y-10">
      <section className="space-y-5 pt-2 sm:pt-4">
        <div className="space-y-3">
          <h2 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">استودیو تصویر طلا</h2>
          <p className="text-sm text-muted">سلام {userName || "دوست عزیز"}، پروژه بعدی را همین حالا شروع کنید.</p>
        </div>

        <JewelryImageFrame aspect="portrait" className="bg-surface-soft">
          <Image src={homeHero.src} alt={homeHero.alt} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 760px" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5">
            <div className="space-y-2 text-surface">
              <p className="text-base font-medium">نور نرم، پس‌زمینه تمیز</p>
              <p className="text-xs text-surface/80">استودیو آماده تولید تصویر ادیتوریال جواهرات است.</p>
            </div>
          </div>
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
          {recentProjects.length > 0
            ? recentProjects.slice(0, 3).map((project, index) => {
                const fallbackImage = previewImages[index % previewImages.length];
                const thumbnailSrc = project.sourceImageUrl || fallbackImage.src;

                return (
                  <a key={project.id} href={`/projects/${project.id}`} className="space-y-2">
                    <JewelryImageFrame className="border-border/80">
                      <Image src={thumbnailSrc} alt={project.title || fallbackImage.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 280px" />
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
                );
              })
            : previewImages.map((placeholder) => (
                <div key={placeholder.src} className="space-y-2">
                  <JewelryImageFrame className="border-border/80 bg-surface-soft">
                    <Image src={placeholder.src} alt={placeholder.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 280px" />
                  </JewelryImageFrame>
                  <p className="px-1 text-xs text-muted">{placeholder.title}</p>
                </div>
              ))}
        </div>
      </section>
    </PageShell>
  );
}
