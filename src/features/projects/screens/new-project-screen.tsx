import { PageShell } from "@/components/ui/page-shell";
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
    <PageShell maxWidth="lg" className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-sm font-medium text-foreground">پروژه جدید</h2>
      </header>

      <NewProjectForm action={action} />
    </PageShell>
  );
}
