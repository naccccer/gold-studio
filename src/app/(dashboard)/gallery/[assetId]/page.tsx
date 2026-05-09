import { notFound } from "next/navigation";
import { GalleryAssetScreen, type GalleryAssetDetail } from "@/features/gallery/screens/gallery-asset-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { storagePublicUrl } from "@/lib/storage";

export default async function GalleryAssetPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const session = await requireUserSession();
  const { assetId } = await params;
  const asset = await db.productAsset.findFirst({
    where: { id: assetId, userId: session.userId, status: "READY", archivedAt: null },
    include: {
      projects: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          resultImageUrl: true,
          resultStorageKey: true,
          sourceImageUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!asset) {
    notFound();
  }

  return (
    <GalleryAssetScreen
      asset={{
        ...asset,
        fileUrl: storagePublicUrl(asset.storageKey),
        projects: asset.projects.map((project) => ({
          ...project,
          sourceImageUrl: storagePublicUrl(asset.storageKey),
          resultImageUrl: project.resultStorageKey ? storagePublicUrl(project.resultStorageKey) : project.resultImageUrl,
        })),
      } as GalleryAssetDetail}
    />
  );
}
