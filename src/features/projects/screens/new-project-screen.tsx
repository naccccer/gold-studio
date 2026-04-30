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
    <PageShell maxWidth="lg" className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-3xl leading-tight text-foreground">پروژه جدید</h2>
          <p className="text-xs text-muted">تصویر، سبک، تولید</p>
        </div>
        <ProgressiveHint title="نکته">یک تصویر واضح کافی است.</ProgressiveHint>
      </header>

      <NewProjectForm action={action} />
    </PageShell>
  );
}
