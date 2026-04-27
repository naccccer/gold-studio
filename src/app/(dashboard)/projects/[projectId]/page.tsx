import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { STYLE_PRESETS } from "@/features/projects/presets";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireUserSession();
  const { projectId } = await params;

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId: session.userId,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{project.title || "جزئیات پروژه"}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{project.status}</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">سبک انتخابی: {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</p>
        {project.errorMessage ? (
          <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{project.errorMessage}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-slate-800">تصویر اولیه</p>
          <Image src={project.sourceImageUrl} alt="source" width={800} height={800} className="h-auto w-full rounded-2xl border border-slate-200 object-cover" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-slate-800">خروجی نهایی</p>
          {project.resultImageUrl ? (
            <>
              <Image src={project.resultImageUrl} alt="result" width={800} height={800} className="h-auto w-full rounded-2xl border border-slate-200 object-cover" />
              <a
                href={project.resultImageUrl}
                download
                className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm text-white"
              >
                دانلود تصویر
              </a>
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              هنوز خروجی آماده نشده است.
            </p>
          )}
        </div>
      </div>

      <Link href="/projects" className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 px-4 text-sm text-slate-700">
        بازگشت به لیست پروژه‌ها
      </Link>
    </section>
  );
}
