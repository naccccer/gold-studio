import { PageShell } from "@/components/ui/page-shell";
import {
  NewProjectForm,
  type GalleryAssetOption,
  type ReadyStyleReferenceOption,
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
  readyStyleReferences: ReadyStyleReferenceOption[];
  styleReferences: StyleReferenceOption[];
  styles: StyleOption[];
  selectedAssetId?: string;
  selectedReferenceId?: string;
  freeVariantParentId?: string;
  defaultOutputPreset?: "post" | "story" | "banner";
  initialStep?: "source" | "size" | "style";
  initialStyleId?: string;
};

export function NewProjectScreen({
  action,
  galleryAssets,
  readyStyleReferences,
  styleReferences,
  styles,
  selectedAssetId,
  selectedReferenceId,
  freeVariantParentId,
  defaultOutputPreset,
  initialStep,
  initialStyleId,
}: NewProjectScreenProps) {
  return (
    <PageShell maxWidth="lg" minHeight={false} className="flex-1 space-y-5 overflow-hidden pb-0">
      <NewProjectForm
        action={action}
        galleryAssets={galleryAssets}
        readyStyleReferences={readyStyleReferences}
        styleReferences={styleReferences}
        styles={styles}
        selectedAssetId={selectedAssetId}
        selectedReferenceId={selectedReferenceId}
        freeVariantParentId={freeVariantParentId}
        defaultOutputPreset={defaultOutputPreset}
        initialStep={initialStep}
        initialStyleId={initialStyleId}
      />
    </PageShell>
  );
}
