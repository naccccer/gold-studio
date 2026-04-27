import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { STYLE_PRESETS } from "@/features/projects/presets";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

export default async function ProjectsPage() {
  const session = await requireUserSession();

  const projects = await db.project.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">پروژه‌های من</h2>
          <p className="mt-1 text-sm text-slate-600">وضعیت تولید و خروجی هر پروژه را اینجا ببینید.</p>
        </div>
        <Link href="/projects/new" className="rounded-full bg-slate-950 px-4 py-2 text-sm text-white">
          پروژه جدید
        </Link>
      </div>

      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            هنوز پروژه‌ای ندارید.
          </div>
        ) : null}

        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-amber-300"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-900">{project.title || "بدون عنوان"}</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{project.status}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">سبک: {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
