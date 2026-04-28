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
        <h2 className="text-lg font-semibold text-slate-900">Ø´Ø±ÙˆØ¹ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯</h2>
        <p className="mt-2 text-sm text-slate-600">
          ÛŒÚ© Ø¹Ú©Ø³ Ø®Ø§Ù… Ø¢Ù¾Ù„ÙˆØ¯ Ú©Ù†ÛŒØ¯ØŒ Ø³Ø¨Ú© Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯ Ùˆ Ø®Ø±ÙˆØ¬ÛŒ Ù†Ù‡Ø§ÛŒÛŒ Ø±Ø§ Ø¯Ø±ÛŒØ§ÙØª Ú©Ù†ÛŒØ¯.
        </p>
      </Surface>

      <NewProjectForm action={action} />
    </PageShell>
  );
}
