import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { ProgressiveHint } from "@/components/ui/progressive-hint";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";
import { archiveItems, extras } from "@/lib/placeholders/jewelry-images";

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
  const emptyPreview = archiveItems[0];
  const emptyRail = [...archiveItems.slice(1, 3), ...extras.slice(0, 2)];

  return (
    <PageShell maxWidth="lg" className="space-y-7">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-3xl leading-tight text-foreground">آرشیو</h2>
          <p className="text-xs text-muted">کتابخانه تصویری پروژه‌های شما</p>
        </div>
        <ButtonLink href="/projects/new" size="sm">
          پروژه جدید
        </ButtonLink>
      </header>

      {projects.length === 0 ? (
        <section className="grid gap-5 pt-2 md:grid-cols-[minmax(0,0.9fr)_minmax(260px,1fr)] md:items-end">
          <JewelryImageFrame aspect="portrait" className="bg-surface-soft shadow-none">
            <Image
              src={emptyPreview.src}
              alt={emptyPreview.alt}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 460px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-5">
              <p className="text-sm font-medium text-surface">اولین تصویر برند اینجا می‌نشیند.</p>
            </div>
          </JewelryImageFrame>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {emptyRail.map((placeholder) => (
                <JewelryImageFrame key={placeholder.src} className="bg-surface-soft shadow-none">
                  <Image
                    src={placeholder.src}
                    alt={placeholder.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 180px"
                  />
                </JewelryImageFrame>
              ))}
            </div>
            <div className="space-y-3">
              <ProgressiveHint title="آرشیو">پس از تولید، خروجی‌ها اینجا مثل یک گالری ذخیره می‌شوند.</ProgressiveHint>
              <ButtonLink href="/projects/new" variant="secondary" className="w-full md:w-auto">
                شروع اولین پروژه
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-3">
          {projects.map((project, index) => {
            const fallbackImage = archiveItems[index % archiveItems.length];
            const thumbnailSrc = project.sourceImageUrl || fallbackImage.src;

            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="group space-y-2">
                <JewelryImageFrame
                  aspect={index % 3 === 0 ? "portrait" : "square"}
                  className="bg-surface-soft shadow-none transition group-hover:border-border-strong"
                >
                  <Image
                    src={thumbnailSrc}
                    alt={project.title || fallbackImage.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 320px"
                  />
                </JewelryImageFrame>
                <div className="space-y-1 px-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {project.title || "بدون عنوان"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    <span>{dateFormatter.format(project.createdAt)}</span>
                    <span className="px-1">·</span>
                    <span>{statusLabelMap[project.status] ?? project.status}</span>
                    <span className="px-1">·</span>
                    <span>{styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</span>
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
