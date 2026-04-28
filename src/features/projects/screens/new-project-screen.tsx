import { PageShell } from "@/components/ui/page-shell";
import { QuietMeta, StudioHero } from "@/components/ui/studio-primitives";
import { NewProjectForm } from "@/features/projects/components/new-project-form";
import type { ProjectFormState } from "@/features/projects/actions";

type NewProjectScreenProps = {
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
};

export function NewProjectScreen({ action }: NewProjectScreenProps) {
  return (
    <PageShell maxWidth="lg" className="space-y-6 sm:space-y-8">
      <StudioHero>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-surface/80">GOLD STUDIO</p>
        <h2 className="section-title text-surface">خلق تصویر تبلیغاتی محصول</h2>
        <QuietMeta className="text-surface/70">آپلود کن، جهت هنری را انتخاب کن، خروجی نهایی را تحویل بگیر.</QuietMeta>
      </StudioHero>

      <NewProjectForm action={action} />
    </PageShell>
  );
}
