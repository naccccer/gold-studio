import Link from "next/link";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { archiveItems, extras } from "@/lib/placeholders/jewelry-images";

const galleryFallbacks = [...archiveItems, ...extras];
const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));
const premiumFallbackTitles = ["انگشتر زمرد", "حلقه کلاسیک", "گردنبند طلا", "دستبند مینیمال", "گوشواره طلایی", "ست عروس"];
const statusLabelMap: Record<string, string> = {
  PENDING: "در حال آماده‌سازی",
  COMPLETED: "آماده",
  FAILED: "نیازمند تکرار",
};

export type ProjectListItem = {
  id: string;
  title: string | null;
  status: string;
  stylePreset: StylePresetId;
  resultImageUrl: string | null;
  sourceImageUrl: string | null;
  createdAt: Date;
};

type ProjectsListScreenProps = {
  projects: ProjectListItem[];
};

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

export function ProjectsListScreen({ projects }: ProjectsListScreenProps) {
  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-4">
      <div className="flex justify-end">
        <ButtonLink href="/projects/new" size="sm" className="h-9 rounded-[var(--radius-md)] px-3 text-[12px]">
          <Plus aria-hidden="true" className="h-4 w-4" />
          پروژه جدید
        </ButtonLink>
      </div>

      {projects.length === 0 ? (
        <section className="space-y-4">
          <JewelryImageFrame aspect="portrait" className="rounded-[1.25rem] border-border/60 bg-surface-soft shadow-none">
            <SafeJewelryImage
              src={galleryFallbacks[0].src}
              fallbackSrc={galleryFallbacks[1].src}
              fallbackAlt={galleryFallbacks[0].alt}
              alt="نمونه آرشیو جواهرات"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 680px"
            />
          </JewelryImageFrame>
          <p className="text-center text-sm leading-7 text-muted">اولین تصویر محصول را بسازید و آرشیو تصویری برندتان را شروع کنید.</p>
          <ButtonLink href="/projects/new" className="w-full">
            <Plus aria-hidden="true" className="h-4 w-4" />
            شروع اولین پروژه
          </ButtonLink>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5">
          {projects.map((project, index) => {
            const fallbackImage = galleryFallbacks[index % galleryFallbacks.length];
            const fallbackTitle = premiumFallbackTitles[index % premiumFallbackTitles.length];
            const projectTitle = project.title?.trim() || fallbackTitle;
            const imageSrc = project.resultImageUrl?.trim() || project.sourceImageUrl?.trim() || fallbackImage.src;

            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block space-y-2.5">
                <JewelryImageFrame aspect="portrait" className="rounded-[1rem] border-border/60 bg-surface-soft shadow-none transition group-hover:border-border-strong">
                  <SafeJewelryImage
                    src={imageSrc}
                    fallbackSrc={fallbackImage.src}
                    fallbackAlt={fallbackImage.alt}
                    alt={projectTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 320px"
                  />
                </JewelryImageFrame>

                <div className="space-y-1 px-0.5">
                  <p className="truncate text-sm text-foreground">{projectTitle}</p>
                  <p className="truncate text-[10px] text-muted/70">
                    {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}
                    <span className="px-1">·</span>
                    {statusLabelMap[project.status] ?? project.status}
                    <span className="px-1">·</span>
                    {dateFormatter.format(project.createdAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </PageShell>
  );
}
