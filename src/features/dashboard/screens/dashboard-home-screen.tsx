import Image from "next/image";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { archiveItems, homeHero, styleSamples } from "@/lib/placeholders/jewelry-images";

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

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" });

export function DashboardHomeScreen({ recentProjects }: DashboardHomeScreenProps) {
  const previewItems = recentProjects.length > 0 ? recentProjects.slice(0, 2) : archiveItems.slice(0, 2);

  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-3">
      <section className="space-y-5">
        <div className="group relative h-[410px] overflow-hidden rounded-[1.45rem] border border-white/80 bg-[#e9dfcf] shadow-[0_28px_58px_-46px_rgba(17,16,14,0.7)]">
          <Image
            src={homeHero.src}
            alt={homeHero.alt}
            fill
            priority
            className="animate-[ovalaHeroSlideA_12s_ease-in-out_infinite] object-cover object-[52%_58%]"
            sizes="(max-width: 768px) 100vw, 920px"
          />
          <Image
            src={styleSamples[0].src}
            alt=""
            fill
            className="animate-[ovalaHeroSlideB_12s_ease-in-out_infinite] object-cover object-[50%_55%]"
            sizes="(max-width: 768px) 100vw, 920px"
          />
          <Image
            src={styleSamples[2].src}
            alt=""
            fill
            className="animate-[ovalaHeroSlideC_12s_ease-in-out_infinite] object-cover object-[50%_52%]"
            sizes="(max-width: 768px) 100vw, 920px"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/66 via-black/12 to-transparent p-4 text-surface">
            <div className="flex items-end justify-between gap-3">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] text-[#fff7e7]">
                <Sparkles aria-hidden="true" className="h-3 w-3" />
                پیشنهاد هفته
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-5 rounded-full bg-surface" />
                <span className="h-1.5 w-1.5 rounded-full bg-surface/48" />
                <span className="h-1.5 w-1.5 rounded-full bg-surface/48" />
              </div>
            </div>
          </div>
        </div>

        <ButtonLink href="/projects/new" size="full" className="h-12 rounded-[1rem] text-sm">
          <Plus aria-hidden="true" className="h-4 w-4" />
          پروژه جدید
        </ButtonLink>

        <div className="grid grid-cols-2 gap-3">
          {previewItems.map((item, index) => {
            const isProject = "id" in item;
            const fallback = archiveItems[index % archiveItems.length];
            const imageSrc = isProject ? item.resultImageUrl || item.sourceImageUrl : item.src;
            const imageAlt = isProject ? item.title || fallback.alt : fallback.alt;
            const href = isProject ? `/projects/${item.id}` : "/projects";
            const createdAt = isProject ? item.createdAt : new Date();

            return (
              <Link key={href + index} href={href} className="relative block h-[112px] overflow-hidden rounded-[1rem] bg-[#e8dfd2]">
                <SafeJewelryImage
                  src={imageSrc}
                  fallbackSrc={fallback.src}
                  fallbackAlt={fallback.alt}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 220px"
                />
                <span className="absolute bottom-2 right-2 rounded-full bg-surface/84 px-2 py-0.5 text-[10px] font-medium text-muted backdrop-blur">
                  {dateFormatter.format(createdAt)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
