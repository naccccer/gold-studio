import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { archiveItems, homeHero } from "@/lib/placeholders/jewelry-images";

const statusLabelMap: Record<string, string> = {
  QUEUED: "در صف",
  PROCESSING: "در حال تولید",
  COMPLETED: "آماده",
  FAILED: "نیازمند تکرار",
};

export type DashboardRecentProject = {
  id: string;
  title: string | null;
  status: string;
  style: { name: string };
  sourceImageUrl: string;
  resultImageUrl?: string | null;
  createdAt: Date;
};

type DashboardHomeScreenProps = {
  userName?: string | null;
  projectCount: number;
  completedCount: number;
  recentProjects: DashboardRecentProject[];
};

export function DashboardHomeScreen({ recentProjects }: DashboardHomeScreenProps) {
  const previewItems = recentProjects.length > 0 ? recentProjects.slice(0, 4) : archiveItems.slice(0, 4);

  return (
    <PageShell maxWidth="lg" className="space-y-6">
      <section className="space-y-4">
        <JewelryImageFrame aspect="portrait" className="mx-auto w-full rounded-[1.65rem] border-white/80 bg-surface shadow-[0_30px_80px_-58px_rgba(23,20,17,0.65)]">
          <Image
            src={homeHero.src}
            alt={homeHero.alt}
            fill
            priority
            className="object-cover object-[52%_58%]"
            sizes="(max-width: 768px) 100vw, 920px"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/62 via-black/18 to-transparent p-5 text-surface">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px]">
              <Sparkles aria-hidden="true" className="h-3 w-3" />
              آماده ساخت
            </p>
            <h2 className="mt-2 text-xl font-semibold text-surface">تصویر تازه بسازید</h2>
          </div>
        </JewelryImageFrame>

        <ButtonLink href="/projects/new" className="h-12 w-full rounded-[0.95rem] text-[13px]">
          <Plus aria-hidden="true" className="h-4 w-4" />
          پروژه جدید
        </ButtonLink>
      </section>

      <section className="space-y-4 pb-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">آخرین کارها</h2>
          <ButtonLink href="/projects" variant="ghost" size="sm" className="h-8 px-2.5 text-[11px] text-muted">
            همه
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </ButtonLink>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {previewItems.map((item, index) => {
            const isReal = "id" in item;
            const fallback = archiveItems[index % archiveItems.length];
            const imageSrc = isReal ? item.resultImageUrl || item.sourceImageUrl : item.src;
            const imageAlt = isReal ? item.title || fallback.alt : item.alt;

            return (
              <Link key={isReal ? item.id : item.src} href={isReal ? `/projects/${item.id}` : "/projects"} className="group block space-y-2">
                <JewelryImageFrame aspect="portrait" className="rounded-[1.05rem] bg-surface-soft shadow-none transition group-hover:border-border-strong">
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
                    {item.style.name}
                    <span className="px-1">·</span>
                    {statusLabelMap[item.status] ?? item.status}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
