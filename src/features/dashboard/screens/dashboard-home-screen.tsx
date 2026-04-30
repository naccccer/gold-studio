import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { ProgressiveHint } from "@/components/ui/progressive-hint";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { archiveItems, extras, homeHero } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusLabelMap: Record<string, string> = {
  PENDING: "در انتظار خروجی",
  COMPLETED: "آماده",
  FAILED: "نیازمند بازبینی",
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
  const previewImages = [...archiveItems.slice(0, 2), ...extras.slice(0, 2)];
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <PageShell maxWidth="lg" className="space-y-10 sm:space-y-12">
      <section className="grid gap-6 pt-2 lg:grid-cols-[minmax(0,0.82fr)_minmax(360px,1fr)] lg:items-end">
        <div className="space-y-6 lg:pb-10">
          <div className="space-y-3">
            <h2 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
              استودیوی طلای شما
            </h2>
            <p className="max-w-xs text-sm text-muted">
              {firstName ? `${firstName} عزیز، ` : ""}یک تصویر لوکس تازه بسازید.
            </p>
          </div>

          <div className="max-w-xs space-y-3">
            <ButtonLink href="/projects/new" size="full">
              شروع پروژه جدید
            </ButtonLink>
            <ButtonLink href="/projects" variant="ghost" className="w-full">
              دیدن آرشیو
            </ButtonLink>
          </div>

          <ProgressiveHint title="نکته">یک عکس ساده از محصول برای شروع کافی است.</ProgressiveHint>
        </div>

        <JewelryImageFrame aspect="portrait" className="min-h-[460px] bg-surface-soft shadow-none">
          <Image
            src={homeHero.src}
            alt={homeHero.alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 560px"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-5">
            <p className="text-sm font-medium text-surface">نور نرم، تمرکز روی جزئیات</p>
          </div>
        </JewelryImageFrame>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-foreground">کارهای اخیر</h3>
          <span className="text-xs text-muted">گالری کوتاه</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {recentProjects.length > 0
            ? recentProjects.slice(0, 4).map((project, index) => {
                const fallbackImage = previewImages[index % previewImages.length];
                const thumbnailSrc = project.sourceImageUrl || fallbackImage.src;

                return (
                  <a key={project.id} href={`/projects/${project.id}`} className="group space-y-2">
                    <JewelryImageFrame className="bg-surface-soft shadow-none transition group-hover:border-border-strong">
                      <Image
                        src={thumbnailSrc}
                        alt={project.title || fallbackImage.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 240px"
                      />
                    </JewelryImageFrame>
                    <div className="space-y-1 px-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {project.title || "پروژه بدون عنوان"}
                      </p>
                      <p className="truncate text-xs text-muted">
                        <span>{styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</span>
                        <span className="px-1">·</span>
                        <span>{statusLabelMap[project.status] ?? project.status}</span>
                        <span className="px-1">·</span>
                        <span>{persianDateFormatter.format(project.createdAt)}</span>
                      </p>
                    </div>
                  </a>
                );
              })
            : previewImages.map((placeholder) => (
                <div key={placeholder.src} className="space-y-2">
                  <JewelryImageFrame className="bg-surface-soft shadow-none">
                    <Image
                      src={placeholder.src}
                      alt={placeholder.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 240px"
                    />
                  </JewelryImageFrame>
                  <p className="px-1 text-xs text-muted">{placeholder.title || "نمونه آرشیو"}</p>
                </div>
              ))}
        </div>
      </section>
    </PageShell>
  );
}
