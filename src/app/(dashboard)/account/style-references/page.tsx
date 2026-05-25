import { StyleReferenceGalleryScreen } from "@/features/style-references/screens/style-reference-gallery-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { storagePublicUrl } from "@/lib/storage";

export default async function StyleReferencesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await requireUserSession();
  const params = await searchParams;
  const assets = await db.styleReferenceAsset.findMany({
    where: { userId: session.userId, status: "READY", archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      storageKey: true,
      title: true,
      originalName: true,
      createdAt: true,
    },
  });

  return (
    <StyleReferenceGalleryScreen
      assets={assets.map((asset) => ({ ...asset, fileUrl: storagePublicUrl(asset.storageKey) }))}
      error={params?.error}
    />
  );
}
