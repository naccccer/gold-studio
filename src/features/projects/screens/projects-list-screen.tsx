import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { archiveItems, extras } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));
const galleryFallbacks = [...archiveItems, ...extras];

const statusLabelMap: Record<string, string> = {
  PENDING: "در انتظار",
  COMPLETED: "آماده",
  FAILED: "نیازمند بازبینی",
};

export type ProjectListItem = {
  id: string;
  title: string | null;
  status: string;
  stylePreset: StylePresetId;
  sourceImageUrl: string | null;
  createdAt: Date;
};

type ProjectsListScreenProps = {
  projects: ProjectListItem[];
};

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

export function ProjectsListScreen({ projects }: ProjectsListScreenProps) {
  return (
    <PageShell maxWidth="lg" className="space-y-6 pb-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-medium text-foreground">پروژه‌ها</h1>
          <ButtonLink href="/projects/new" size="sm" className="h-9 rounded-[var(--radius-md)] px-3 text-[12px]">
            پروژه جدید
          </ButtonLink>
        </div>
        <p className="text-xs text-muted">گالری منتخب خروجی‌ها</p>
      </header>

      {projects.length === 0 ? (
        <section className="space-y-4">
          <JewelryImageFrame aspect="portrait" className="rounded-[1.25rem] border-border/60 bg-surface-soft shadow-none">
            <SafeJewelryImage
              src={galleryFallbacks[0].src}
              fallbackSrc={galleryFallbacks[1].src}
              fallbackAlt={galleryFallbacks[0].alt}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 680px"
            />
          </JewelryImageFrame>
          <p className="text-center text-sm text-muted">اولین پروژه‌ات را بساز و گالری برندت را شروع کن.</p>
          <ButtonLink href="/projects/new" className="w-full">
            شروع اولین پروژه
          </ButtonLink>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5">
          {projects.map((project, index) => {
            const fallbackImage = galleryFallbacks[index % galleryFallbacks.length];
            const styleLabel = styleLabelMap.get(project.stylePreset) ?? "سبک انتخابی";
            const statusLabel = statusLabelMap[project.status] ?? "ثبت شده";
            const projectTitle = project.title?.trim() || fallbackImage.title || "پروژه جواهر";
            const sourceImage = project.sourceImageUrl?.trim() || null;

            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block space-y-2.5">
                <JewelryImageFrame
                  aspect="portrait"
                  className="rounded-[1rem] border-border/60 bg-surface-soft shadow-none transition group-hover:border-border-strong"
                >
                  <SafeJewelryImage
                    src={sourceImage}
                    fallbackSrc={fallbackImage.src}
                    fallbackAlt={fallbackImage.alt}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 320px"
                  />
                </JewelryImageFrame>

                <div className="space-y-1 px-0.5">
                  <p className="truncate text-sm text-foreground">{projectTitle}</p>
                  <p className="truncate text-[11px] text-muted/90">
                    {statusLabel}
                    <span className="px-1">·</span>
                    {styleLabel}
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
