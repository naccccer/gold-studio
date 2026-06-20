import { StyleReferenceGalleryScreen } from "@/features/style-references/screens/style-reference-gallery-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getReadyStyleReferenceSamples } from "@/lib/ready-style-reference-samples";
import { storagePublicUrl } from "@/lib/storage";

const readySampleOriginalNamePrefix = "ready-sample:";

export default async function StyleReferencesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await requireUserSession();
  const params = await searchParams;
  const [assets, readySamples] = await Promise.all([
    db.styleReferenceAsset.findMany({
      where: { userId: session.userId, status: "READY", archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        storageKey: true,
        title: true,
        originalName: true,
        createdAt: true,
      },
    }),
    getReadyStyleReferenceSamples(),
  ]);

  return (
    <StyleReferenceGalleryScreen
      assets={assets
        .filter((asset) => !asset.originalName?.startsWith(readySampleOriginalNamePrefix))
        .map((asset) => ({ ...asset, fileUrl: storagePublicUrl(asset.storageKey) }))}
      emptySamples={readySamples.map((sample) => ({
        id: sample.id,
        fileUrl: sample.fileUrl,
        title: sample.title,
      }))}
      error={params?.error}
    />
  );
}
