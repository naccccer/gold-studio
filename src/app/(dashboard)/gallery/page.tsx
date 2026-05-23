import { GalleryScreen, type GalleryAssetItem } from "@/features/gallery/screens/gallery-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { storagePublicUrl } from "@/lib/storage";
import { getUserVisibleStyles } from "@/lib/styles";

type GalleryPageProps = {
  searchParams?: Promise<{ deleteNotice?: string; undoAssetIds?: string }>;
};

function normalizeDeleteNotice(value?: string) {
  return value === "deleted" || value === "partial" || value === "archived" || value === "restored" ? value : undefined;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const session = await requireUserSession();
  const params = await searchParams;
  const [assets, styles] = await Promise.all([
    db.productAsset.findMany({
      where: { userId: session.userId, status: "READY", archivedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        projects: {
          select: { id: true, status: true },
        },
      },
    }),
    getUserVisibleStyles(),
  ]);

  const displayAssets = assets.map((asset) => ({
    ...asset,
    fileUrl: storagePublicUrl(asset.storageKey),
  }));

  return (
    <GalleryScreen
      assets={displayAssets as GalleryAssetItem[]}
      styles={styles}
      deleteNotice={normalizeDeleteNotice(params?.deleteNotice)}
      undoAssetIds={params?.undoAssetIds}
    />
  );
}
