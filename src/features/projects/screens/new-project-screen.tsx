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
    <PageShell maxWidth="lg" className="space-y-6 sm:space-y-8">
      <Surface padding="lg" className="space-y-3">
        <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">شروع تولید تصویر جدید</h2>
        <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
          اینجا فضای تولید استودیویی شماست: تصویر محصول را وارد کنید، سبک نهایی را انتخاب کنید و خروجی تبلیغاتی را آماده تحویل بگیرید.
        </p>
      </Surface>

      <NewProjectForm action={action} />
    </PageShell>
  );
}
