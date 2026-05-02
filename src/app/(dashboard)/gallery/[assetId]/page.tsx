import { notFound } from "next/navigation";
import { GalleryAssetScreen, type GalleryAssetDetail } from "@/features/gallery/screens/gallery-asset-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function GalleryAssetPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const session = await requireUserSession();
  const { assetId } = await params;
  const asset = (await db.productAsset.findFirst({
    where: { id: assetId, userId: session.userId },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  })) as GalleryAssetDetail | null;

  if (!asset) {
    notFound();
  }

  return <GalleryAssetScreen asset={asset} />;
}
