import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { archiveItems } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusLabelMap: Record<string, string> = {
  PENDING: "در انتظار",
  COMPLETED: "آماده",
  FAILED: "بازبینی",
};

export type ProjectListItem = {
  id: string;
  title: string | null;
  status: string;
  stylePreset: StylePresetId;
  sourceImageUrl: string;
  createdAt: Date;
};

type ProjectsListScreenProps = {
  projects: ProjectListItem[];
};

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

export function ProjectsListScreen({ projects }: ProjectsListScreenProps) {
  return (
    <PageShell maxWidth="lg" className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-foreground">آرشیو</h2>
        <ButtonLink href="/projects/new" size="sm">
          پروژه جدید
        </ButtonLink>
      </header>

      {projects.length === 0 ? (
        <section className="space-y-4">
          <JewelryImageFrame aspect="portrait" className="min-h-[420px] bg-surface-soft shadow-none">
            <Image src={archiveItems[0].src} alt={archiveItems[0].alt} fill priority className="object-cover" sizes="100vw" />
          </JewelryImageFrame>
          <ButtonLink href="/projects/new" variant="secondary" className="w-full sm:w-auto">
            شروع اولین پروژه
          </ButtonLink>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-4">
          {projects.map((project, index) => {
            const fallbackImage = archiveItems[index % archiveItems.length];
            const thumbnailSrc = project.sourceImageUrl || fallbackImage.src;

            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="group space-y-2">
                <JewelryImageFrame className="bg-surface-soft shadow-none transition group-hover:border-border-strong">
                  <Image
                    src={thumbnailSrc}
                    alt={project.title || fallbackImage.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </JewelryImageFrame>
                <p className="truncate px-1 text-[11px] text-muted">
                  {dateFormatter.format(project.createdAt)}
                  <span className="px-1">·</span>
                  {statusLabelMap[project.status] ?? project.status}
                  <span className="px-1">·</span>
                  {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}
                </p>
              </Link>
            );
          })}
        </section>
      )}
    </PageShell>
  );
}
