import { PageShell } from "@/components/ui/page-shell";
import { ProgressiveHint } from "@/components/ui/progressive-hint";
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
    <PageShell maxWidth="lg" className="space-y-4 sm:space-y-6">
      <section className="space-y-2">
        <h2 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">اتاق تولید تصویر</h2>
        <p className="text-sm text-muted">عکس محصول، انتخاب سبک، شروع تولید.</p>
        <ProgressiveHint title="نکته">فقط یک تصویر واضح کافی است.</ProgressiveHint>
      </section>

      <NewProjectForm action={action} />
    </PageShell>
  );
}
