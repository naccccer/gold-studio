import Image from "next/image";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

export type ProjectDetail = {
  title: string | null;
  sourceImageUrl: string;
  resultImageUrl: string | null;
  status: string;
  stylePreset: StylePresetId;
  errorMessage: string | null;
};

type ProjectDetailScreenProps = {
  project: ProjectDetail;
};

export function ProjectDetailScreen({ project }: ProjectDetailScreenProps) {
  return (
    <PageShell maxWidth="lg">
      <Surface padding="lg">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{project.title || "جزئیات پروژه"}</h2>
          <StatusPill>{project.status}</StatusPill>
        </div>
        <p className="mt-2 text-sm text-slate-600">سبک انتخابی: {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</p>
        {project.errorMessage ? (
          <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{project.errorMessage}</p>
        ) : null}
      </Surface>

      <div className="grid gap-4 sm:grid-cols-2">
        <Surface>
          <p className="mb-3 text-sm font-medium text-slate-800">تصویر اولیه</p>
          <Image src={project.sourceImageUrl} alt="source" width={800} height={800} className="h-auto w-full rounded-2xl border border-slate-200 object-cover" />
        </Surface>

        <Surface>
          <p className="mb-3 text-sm font-medium text-slate-800">خروجی نهایی</p>
          {project.resultImageUrl ? (
            <>
              <Image src={project.resultImageUrl} alt="result" width={800} height={800} className="h-auto w-full rounded-2xl border border-slate-200 object-cover" />
              <a href={project.resultImageUrl} download className={buttonClasses({ className: "mt-3", size: "sm" })}>
                دانلود تصویر
              </a>
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              هنوز خروجی آماده نشده است.
            </p>
          )}
        </Surface>
      </div>

      <ButtonLink href="/projects" variant="secondary" size="sm">
        بازگشت به لیست پروژه‌ها
      </ButtonLink>
    </PageShell>
  );
}
