import Link from "next/link";
import { Plus } from "lucide-react";
import { ActionDock } from "@/components/ui/action-dock";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { archiveItems, extras } from "@/lib/placeholders/jewelry-images";

const galleryFallbacks = [...archiveItems, ...extras];
const statusLabelMap: Record<string, string> = {
  QUEUED: "در صف",
  PROCESSING: "در حال ساخت",
  COMPLETED: "آماده",
  FAILED: "نیازمند تکرار",
};

export type ProjectListItem = {
  id: string;
  title: string | null;
  status: string;
  style: { name: string };
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
    <PageShell maxWidth="lg" className="space-y-5 pb-3">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-5">
        {projects.length === 0 ? (
          <section className="space-y-3">
            <div className="relative h-[218px] overflow-hidden rounded-[1.45rem] border border-white/80 bg-[#e7ded2]">
              <SafeJewelryImage
                src={galleryFallbacks[0].src}
                fallbackSrc={galleryFallbacks[1].src}
                fallbackAlt={galleryFallbacks[0].alt}
                alt="نمونه خروجی پروژه"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 680px"
              />
            </div>
            <p className="text-center text-sm text-muted">هنوز خروجی تولید نشده است.</p>
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-3">
            {projects.map((project, index) => {
              const fallbackImage = galleryFallbacks[index % galleryFallbacks.length];
              const imageSrc = project.resultImageUrl?.trim() || project.sourceImageUrl?.trim() || fallbackImage.src;
              const projectTitle = project.title?.trim() || "پروژه محصول";
              const statusLabel = statusLabelMap[project.status] ?? project.status;

              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="group block space-y-2">
                  <div className="relative h-[156px] overflow-hidden rounded-[1.08rem] border border-white/75 bg-[#ebe2d6] transition group-hover:border-border-strong">
                    <SafeJewelryImage
                      src={imageSrc}
                      fallbackSrc={fallbackImage.src}
                      fallbackAlt={fallbackImage.alt}
                      alt={projectTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 240px"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-black/48 px-2.5 py-1 text-[10px] text-surface backdrop-blur">
                      {statusLabel}
                    </span>
                    <span className="absolute bottom-2 right-2 rounded-full bg-surface/84 px-2 py-0.5 text-[10px] font-medium text-muted backdrop-blur">
                      {dateFormatter.format(project.createdAt)}
                    </span>
                  </div>
                  <div className="space-y-0.5 px-0.5">
                    <p className="truncate text-xs font-semibold text-foreground">{projectTitle}</p>
                    <p className="truncate text-[10px] text-muted">{project.style.name}</p>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        <ActionDock sticky>
          <ButtonLink href="/projects/new" size="full" className="h-12 rounded-[1rem]">
            <Plus aria-hidden={true} className="h-4 w-4" />
            پروژه جدید
          </ButtonLink>
        </ActionDock>
      </div>
    </PageShell>
  );
}
