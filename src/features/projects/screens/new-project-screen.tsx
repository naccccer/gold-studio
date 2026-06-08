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
    <div className="relative isolate flex min-h-0 w-full flex-1 flex-col bg-ink-1 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(212,184,134,0.10),transparent_55%)]"
      />
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
    </div>
  );
}
