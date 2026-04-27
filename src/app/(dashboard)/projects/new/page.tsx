import { NewProjectForm } from "@/components/projects/new-project-form";
import { createProjectAction } from "@/features/projects/actions";
import { requireUserSession } from "@/lib/auth/session";

export default async function NewProjectPage() {
  await requireUserSession();

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">شروع پروژه جدید</h2>
        <p className="mt-2 text-sm text-slate-600">
          یک عکس خام آپلود کنید، سبک را انتخاب کنید و خروجی نهایی را دریافت کنید.
        </p>
      </div>

      <NewProjectForm action={createProjectAction} />
    </section>
  );
}
