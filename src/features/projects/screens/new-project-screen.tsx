import { PageShell } from "@/components/ui/page-shell";
import { Surface } from "@/components/ui/surface";
import { NewProjectForm } from "@/features/projects/components/new-project-form";
import type { ProjectFormState } from "@/features/projects/actions";

type NewProjectScreenProps = {
  action: (
    prevState: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
};

export function NewProjectScreen({ action }: NewProjectScreenProps) {
  return (
    <PageShell>
      <Surface padding="lg">
        <h2 className="text-lg font-semibold text-slate-900">شروع پروژه جدید</h2>
        <p className="mt-2 text-sm text-slate-600">
          یک عکس خام آپلود کنید، سبک را انتخاب کنید و خروجی نهایی را دریافت کنید.
        </p>
      </Surface>

      <NewProjectForm action={action} />
    </PageShell>
  );
}
