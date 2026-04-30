import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { archiveItems, homeHero } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusLabelMap: Record<string, string> = {
  PENDING: "در انتظار",
  COMPLETED: "آماده",
  FAILED: "بازبینی",
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

export function DashboardHomeScreen({ recentProjects }: DashboardHomeScreenProps) {
  return (
    <PageShell maxWidth="lg" className="space-y-8 sm:space-y-10">
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">استودیو</h2>

        <JewelryImageFrame aspect="portrait" className="min-h-[480px] bg-surface-soft shadow-none">
          <Image
            src={homeHero.src}
            alt={homeHero.alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 920px"
          />
        </JewelryImageFrame>

        <div className="grid gap-2 sm:grid-cols-2">
          <ButtonLink href="/projects/new" size="full">
            پروژه جدید
          </ButtonLink>
          <ButtonLink href="/projects" variant="ghost" className="w-full">
            آرشیو
          </ButtonLink>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs text-muted">آخرین کارها</h3>
        <div className="grid grid-cols-2 gap-4">
          {(recentProjects.length > 0 ? recentProjects.slice(0, 4) : archiveItems.slice(0, 4)).map(
            (item, index) => {
              const isReal = "id" in item;
              const imageSrc = isReal ? item.sourceImageUrl || archiveItems[index % archiveItems.length].src : item.src;
              const imageAlt = isReal
                ? item.title || archiveItems[index % archiveItems.length].alt
                : item.alt;

              return (
                <a
                  key={isReal ? item.id : item.src}
                  href={isReal ? `/projects/${item.id}` : "/projects"}
                  className="group space-y-2"
                >
                  <JewelryImageFrame className="bg-surface-soft shadow-none transition group-hover:border-border-strong">
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 360px"
                    />
                  </JewelryImageFrame>
                  {isReal ? (
                    <p className="truncate px-1 text-[11px] text-muted">
                      {styleLabelMap.get(item.stylePreset) ?? item.stylePreset}
                      <span className="px-1">·</span>
                      {statusLabelMap[item.status] ?? item.status}
                      <span className="px-1">·</span>
                      {persianDateFormatter.format(item.createdAt)}
                    </p>
                  ) : null}
                </a>
              );
            },
          )}
        </div>
      </section>
    </PageShell>
  );
}
