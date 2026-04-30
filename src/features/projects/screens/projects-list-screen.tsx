import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { archiveItems } from "@/lib/placeholders/jewelry-images";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

const statusLabelMap: Record<string, string> = {
  PENDING: "در حال تولید",
  COMPLETED: "آماده",
  FAILED: "ناموفق",
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
  const emptyPreview = archiveItems[0];

  return (
    <PageShell maxWidth="lg" className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-foreground">آرشیو استودیو</h2>
        <ButtonLink href="/projects/new" size="sm">پروژه جدید</ButtonLink>
      </header>

      {projects.length === 0 ? (
        <section className="space-y-4 pt-3 text-center">
          <JewelryImageFrame aspect="portrait" className="mx-auto max-w-sm bg-surface-soft">
            <Image src={emptyPreview.src} alt={emptyPreview.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 384px" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-6">
              <p className="text-sm text-surface/90">با اولین پروژه، گالری برندت اینجا شکل می‌گیرد.</p>
            </div>
          </JewelryImageFrame>
          <ButtonLink href="/projects/new" variant="secondary">شروع اولین پروژه</ButtonLink>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => {
            const fallbackImage = archiveItems[index % archiveItems.length];
            const thumbnailSrc = project.sourceImageUrl || fallbackImage.src;

            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="space-y-2">
                <JewelryImageFrame className="bg-surface-soft">
                  <Image src={thumbnailSrc} alt={project.title || fallbackImage.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </JewelryImageFrame>
                <div className="space-y-1 px-1">
                  <p className="truncate text-sm font-medium text-foreground">{project.title || "بدون عنوان"}</p>
                  <p className="text-xs text-muted">
                    {styleLabelMap.get(project.stylePreset) ?? project.stylePreset} · {statusLabelMap[project.status] ?? project.status} · {dateFormatter.format(project.createdAt)}
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
