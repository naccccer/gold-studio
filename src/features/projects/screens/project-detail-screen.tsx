import { AlertTriangle, Download, Images, Maximize2, Plus, RefreshCcw } from "lucide-react";
import { ActionDock } from "@/components/ui/action-dock";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { ProcessingCanvas } from "@/components/ui/processing-canvas";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { ProjectStatusRefresh } from "@/features/projects/components/project-status-refresh";
import { resultHeroDark, uploadPreview } from "@/lib/placeholders/jewelry-images";

const statusConfig: Record<string, { label: string; supportCopy: string; actionLabel: string }> = {
  QUEUED: {
    label: "در صف",
    supportCopy: "پروژه ثبت شد و به زودی وارد پردازش می شود.",
    actionLabel: "در صف تولید",
  },
  PROCESSING: {
    label: "در حال تولید",
    supportCopy: "خروجی در حال آماده سازی است.",
    actionLabel: "در حال تولید",
  },
  COMPLETED: {
    label: "آماده",
    supportCopy: "خروجی نهایی آماده دانلود است.",
    actionLabel: "دانلود تصویر",
  },
  FAILED: {
    label: "ناموفق",
    supportCopy: "تولید کامل نشد. دوباره تلاش کنید.",
    actionLabel: "تلاش دوباره",
  },
};

export type ProjectDetail = {
  title: string | null;
  sourceImageUrl: string;
  resultImageUrl: string | null;
  status: string;
  style: { name: string };
  errorMessage: string | null;
  createdAt?: Date;
};

type ProjectDetailScreenProps = { project: ProjectDetail };

export function ProjectDetailScreen({ project }: ProjectDetailScreenProps) {
  const status = statusConfig[project.status] ?? {
    label: "ثبت شده",
    supportCopy: "وضعیت پروژه ثبت شد.",
    actionLabel: "خروجی نهایی",
  };
  const hasResult = Boolean(project.resultImageUrl);
  const isActive = project.status === "QUEUED" || project.status === "PROCESSING";
  const resultImageSrc = project.resultImageUrl || resultHeroDark.src;
  const sourceImageSrc = project.sourceImageUrl || uploadPreview.src;

  if (isActive) {
    return (
      <PageShell maxWidth="lg" className="space-y-3 pb-3 text-surface">
        <ProjectStatusRefresh active={true} />

        <section className="space-y-3">
          <ProcessingCanvas
            imageSrc={sourceImageSrc}
            imageAlt="در حال پردازش تصویر"
            steps={["تشخیص محصول", "پاک سازی زمینه", "ساخت خروجی نهایی"]}
          />

          <div className="flex w-full items-center justify-center gap-2 py-1">
            <span className="h-1.5 w-8 rounded-full bg-accent" />
            <span className="h-1.5 w-8 rounded-full bg-accent/46" />
            <span className="h-1.5 w-8 rounded-full bg-accent/24" />
          </div>
        </section>

        <ActionDock sticky columns={2}>
          <ButtonLink href="/projects/new" className="h-12 w-full rounded-[1rem] text-sm">
            <Plus aria-hidden={true} className="h-4 w-4" />
            پروژه جدید
          </ButtonLink>
          <ButtonLink href="/gallery" variant="secondary" className="h-12 w-full rounded-[1rem] text-sm">
            <Images aria-hidden={true} className="h-4 w-4" />
            بازگشت به گالری
          </ButtonLink>
        </ActionDock>
      </PageShell>
    );
  }

  if (hasResult && project.status === "COMPLETED") {
    return (
      <PageShell maxWidth="lg" className="space-y-4 pb-3 text-surface">
        <section className="flex min-h-[calc(100svh-12rem)] flex-col gap-4">
          <div className="group relative h-[536px] cursor-zoom-in overflow-hidden rounded-[1.6rem] border border-white/12 bg-[#11100e] shadow-[0_28px_58px_-46px_rgba(17,16,14,0.82)]">
            <SafeJewelryImage
              src={resultImageSrc}
              fallbackSrc={resultHeroDark.src}
              fallbackAlt={resultHeroDark.alt}
              alt={project.title || "خروجی نهایی محصول"}
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 760px"
            />
            <SafeJewelryImage
              src={sourceImageSrc}
              fallbackSrc={uploadPreview.src}
              fallbackAlt={uploadPreview.alt}
              alt="تصویر اولیه"
              fill
              className="pointer-events-none object-cover object-[46%_55%] opacity-0 transition duration-300 group-hover:opacity-100 group-active:opacity-100"
              sizes="(max-width: 768px) 100vw, 760px"
            />
            <div className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/28 text-surface backdrop-blur">
              <Maximize2 aria-hidden={true} className="h-4.5 w-4.5" />
            </div>
          </div>

          <ActionDock className="mt-auto grid-cols-2 pb-3" columns={2}>
            <a
              href={project.resultImageUrl as string}
              download
              className={buttonClasses({
                className: "h-12 w-full rounded-[1rem]",
              })}
            >
              <Download aria-hidden={true} className="h-4 w-4" />
              ذخیره
            </a>
            <ButtonLink href="/projects/new" variant="secondary" className="h-12 w-full rounded-[1rem] text-sm">
              <RefreshCcw aria-hidden={true} className="h-4 w-4" />
              نسخه دیگر
            </ButtonLink>
          </ActionDock>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="lg" className="space-y-4 pb-3 text-surface">
      <section className="space-y-4">
        <div className="relative h-[420px] overflow-hidden rounded-[1.45rem] border border-white/12 bg-[#1a1713] shadow-[0_28px_58px_-46px_rgba(17,16,14,0.82)]">
          <SafeJewelryImage
            src={sourceImageSrc}
            fallbackSrc={uploadPreview.src}
            fallbackAlt={uploadPreview.alt}
            alt={project.title || "تصویر پروژه"}
            fill
            priority
            className="object-cover object-[46%_55%]"
            sizes="(max-width: 768px) 100vw, 760px"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent p-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/30 px-2.5 py-1 text-[10px] text-surface/82">
              <AlertTriangle aria-hidden={true} className="h-3.5 w-3.5" />
              {status.label}
            </p>
            <p className="mt-2 text-sm leading-7 text-surface/78">
              {project.errorMessage || status.supportCopy}
            </p>
          </div>
        </div>
      </section>

      <ActionDock sticky className="space-y-2.5">
        <ButtonLink href="/projects/new" size="full" className="h-12 rounded-[1rem]">
          <RefreshCcw aria-hidden={true} className="h-4 w-4" />
          تلاش دوباره
        </ButtonLink>
        <ButtonLink href="/projects" variant="secondary" className="h-11 w-full rounded-[1rem] text-sm">
          <Images aria-hidden={true} className="h-4 w-4" />
          پروژه ها
        </ButtonLink>
      </ActionDock>
    </PageShell>
  );
}
