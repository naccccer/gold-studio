import { createProjectAction } from "@/features/projects/actions";
import { NewProjectScreen } from "@/features/projects/screens/new-project-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { storagePublicUrl } from "@/lib/storage";
import { getUserVisibleStyles } from "@/lib/styles";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams?: Promise<{ assetId?: string; freeVariantParentId?: string; referenceAssetId?: string; step?: string; styleId?: string }>;
}) {
  const session = await requireUserSession();
  const params = await searchParams;
  const [galleryAssets, styleReferences, selectedStyleReference, styles, outputSettings] = await Promise.all([
    db.productAsset.findMany({
      where: { userId: session.userId, status: "READY", archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        fileUrl: true,
        storageKey: true,
        title: true,
        originalName: true,
        productType: true,
      },
    }),
    db.styleReferenceAsset.findMany({
      where: { userId: session.userId, status: "READY", archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        storageKey: true,
        title: true,
        originalName: true,
      },
    }),
    params?.referenceAssetId
      ? db.styleReferenceAsset.findFirst({
          where: { id: params.referenceAssetId, userId: session.userId, status: "READY", archivedAt: null },
          select: {
            id: true,
            storageKey: true,
            title: true,
            originalName: true,
          },
        })
      : Promise.resolve(null),
    getUserVisibleStyles(),
    db.userOutputSettings.findUnique({ where: { userId: session.userId } }),
  ]);

  const defaultOutputPreset = ["post", "story", "banner"].includes(outputSettings?.defaultOutputPreset ?? "")
    ? (outputSettings?.defaultOutputPreset as "post" | "story" | "banner")
    : "post";
  const initialStep = params?.step === "source" || params?.step === "size" || params?.step === "style"
    ? params.step
    : undefined;
  const resolvedStyleReferences =
    selectedStyleReference && !styleReferences.some((asset) => asset.id === selectedStyleReference.id)
      ? [selectedStyleReference, ...styleReferences]
      : styleReferences;

  return (
    <NewProjectScreen
      action={createProjectAction}
      galleryAssets={galleryAssets.map((asset) => ({ ...asset, fileUrl: storagePublicUrl(asset.storageKey) }))}
      styleReferences={resolvedStyleReferences.map((asset) => ({ ...asset, fileUrl: storagePublicUrl(asset.storageKey) }))}
      styles={styles}
      selectedAssetId={params?.assetId}
      selectedReferenceId={params?.referenceAssetId}
      freeVariantParentId={params?.freeVariantParentId}
      defaultOutputPreset={defaultOutputPreset}
      initialStep={initialStep}
      initialStyleId={params?.styleId}
    />
  );
}
