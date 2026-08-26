import { GalleryScreen, type GalleryAssetItem } from "@/features/gallery/screens/gallery-screen";
import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { storagePublicUrl, storageThumbnailUrl } from "@/lib/storage";
import { getUserVisibleStyles } from "@/lib/styles";
import { getVerticalContent } from "@/lib/vertical-content";

type GalleryPageProps = {
  searchParams?: Promise<{ deleteNotice?: string; undoAssetIds?: string; page?: string }>;
};

const PAGE_SIZE = 24;

function normalizeDeleteNotice(value?: string) {
  return value === "deleted" || value === "partial" || value === "archived" || value === "restored" ? value : undefined;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const content = getVerticalContent(vertical);
  const params = await searchParams;
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = { userId: session.userId, vertical, status: "READY" as const, archivedAt: null };
  const [assets, totalItems, styles] = await Promise.all([
    db.productAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        projects: {
          select: { id: true, status: true },
        },
      },
    }),
    db.productAsset.count({ where }),
    getUserVisibleStyles(vertical),
  ]);

  const displayAssets = assets.map((asset) => ({
    ...asset,
    fileUrl: storagePublicUrl(asset.storageKey),
    thumbnailUrl: storageThumbnailUrl(asset.storageKey, "card"),
  }));
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (page > totalPages) redirect(totalPages > 1 ? `/gallery?page=${totalPages}` : "/gallery");

  return (
    <GalleryScreen
      assets={displayAssets as GalleryAssetItem[]}
      styles={styles}
      content={content}
      deleteNotice={normalizeDeleteNotice(params?.deleteNotice)}
      undoAssetIds={params?.undoAssetIds}
      pagination={{
        page,
        totalPages,
        totalItems,
        previousHref: page > 1 ? `/gallery?page=${page - 1}` : null,
        nextHref: page < totalPages ? `/gallery?page=${page + 1}` : null,
      }}
    />
  );
}
