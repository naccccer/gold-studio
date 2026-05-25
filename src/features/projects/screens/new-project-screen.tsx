import { PageShell } from "@/components/ui/page-shell";
import {
  NewProjectForm,
  type GalleryAssetOption,
  type StyleReferenceOption,
} from "@/features/projects/components/new-project-form";
import type { ProjectFormState } from "@/features/projects/actions";
import type { StyleOption } from "@/features/projects/presets";

type NewProjectScreenProps = {
  action: (
    prevState: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  galleryAssets: GalleryAssetOption[];
  styleReferences: StyleReferenceOption[];
  styles: StyleOption[];
  selectedAssetId?: string;
  freeVariantParentId?: string;
  defaultOutputPreset?: "post" | "story" | "banner";
  initialStep?: "source" | "size" | "style";
};

export function NewProjectScreen({
  action,
  galleryAssets,
  styleReferences,
  styles,
  selectedAssetId,
  freeVariantParentId,
  defaultOutputPreset,
  initialStep,
}: NewProjectScreenProps) {
  return (
    <PageShell maxWidth="lg" minHeight={false} className="flex-1 space-y-5 overflow-hidden pb-0">
      <NewProjectForm
        action={action}
        galleryAssets={galleryAssets}
        styleReferences={styleReferences}
        styles={styles}
        selectedAssetId={selectedAssetId}
        freeVariantParentId={freeVariantParentId}
        defaultOutputPreset={defaultOutputPreset}
        initialStep={initialStep}
      />
    </PageShell>
  );
}
