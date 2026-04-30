import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { archiveItems, homeHero } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusLabelMap: Record<string, string> = {
  PENDING: "در انتظار",
  COMPLETED: "آماده",
  FAILED: "نیازمند بررسی",
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
  const previewItems = recentProjects.length > 0 ? recentProjects.slice(0, 4) : archiveItems.slice(0, 4);

  return (
    <PageShell maxWidth="lg" className="space-y-7">
      <section className="space-y-4">
        <JewelryImageFrame
          aspect="portrait"
          className="mx-auto w-full rounded-[2rem] border-white/80 bg-surface shadow-[0_30px_80px_-58px_rgba(23,20,17,0.7)]"
        >
          <Image
            src={homeHero.src}
            alt={homeHero.alt}
            fill
            priority
            className="object-cover object-[52%_58%]"
            sizes="(max-width: 768px) 100vw, 920px"
          />
        </JewelryImageFrame>

        <ButtonLink
          href="/projects/new"
          className="h-12 w-full rounded-[1rem] border border-[#d7bd8f] !bg-[#c39a5f] text-[13px] !text-surface hover:!bg-[#b88d52]"
        >
          شروع پروژه جدید
        </ButtonLink>
      </section>

      <section className="space-y-4 pb-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium text-foreground">آخرین کارها</h2>
          <ButtonLink href="/projects" variant="ghost" size="sm" className="h-8 px-2.5 text-[11px] text-muted">
            مشاهده همه
          </ButtonLink>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {previewItems.map((item, index) => {
            const isReal = "id" in item;
            const fallback = archiveItems[index % archiveItems.length];
            const imageSrc = isReal ? item.sourceImageUrl : item.src;
            const imageAlt = isReal ? item.title || fallback.alt : item.alt;

            return (
              <a
                key={isReal ? item.id : item.src}
                href={isReal ? `/projects/${item.id}` : "/projects"}
                className="group block space-y-2"
              >
                <JewelryImageFrame aspect="portrait" className="rounded-[1.25rem] bg-surface-soft shadow-none transition group-hover:border-border-strong">
                  <SafeJewelryImage
                    src={imageSrc}
                    fallbackSrc={fallback.src}
                    fallbackAlt={fallback.alt}
                    alt={imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </JewelryImageFrame>
                {isReal ? (
                  <p className="truncate px-1 text-[11px] leading-5 text-muted">
                    {styleLabelMap.get(item.stylePreset) ?? item.stylePreset}
                    <span className="px-1">·</span>
                    {statusLabelMap[item.status] ?? item.status}
                    <span className="px-1">·</span>
                    {persianDateFormatter.format(item.createdAt)}
                  </p>
                ) : null}
              </a>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
