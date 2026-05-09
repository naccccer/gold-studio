import { PageShell } from "@/components/ui/page-shell";
import { NewProjectForm, type GalleryAssetOption } from "@/features/projects/components/new-project-form";
import type { ProjectFormState } from "@/features/projects/actions";
import type { StyleOption } from "@/features/projects/presets";

type NewProjectScreenProps = {
  action: (
    prevState: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  galleryAssets: GalleryAssetOption[];
  styles: StyleOption[];
  selectedAssetId?: string;
  defaultOutputPreset?: "post" | "story" | "banner";
};

export function NewProjectScreen({ action, galleryAssets, styles, selectedAssetId, defaultOutputPreset }: NewProjectScreenProps) {
  return (
    <PageShell maxWidth="lg" className="space-y-5">
      <NewProjectForm action={action} galleryAssets={galleryAssets} styles={styles} selectedAssetId={selectedAssetId} defaultOutputPreset={defaultOutputPreset} />
    </PageShell>
  );
}
