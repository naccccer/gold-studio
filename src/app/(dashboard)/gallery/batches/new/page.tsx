import { notFound } from "next/navigation";
import { createBatchFromGalleryAction } from "@/features/gallery/actions";
import {
  GalleryBatchNewScreen,
  type BatchSourceAsset,
  type BatchStyleReference,
} from "@/features/gallery/screens/gallery-batch-new-screen";
import { requireUserSession } from "@/lib/auth/session";
import { getAvailableGenerationCredits } from "@/lib/billing";
import { db } from "@/lib/db";
import { storagePublicUrl } from "@/lib/storage";
import { getUserVisibleStyles } from "@/lib/styles";

export default async function NewGalleryBatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ assetIds?: string; error?: string }>;
}) {
  const session = await requireUserSession();
  const params = await searchParams;
  const assetIds = Array.from(new Set((params?.assetIds ?? "").split(",").map((id) => id.trim()).filter(Boolean)));

  if (assetIds.length < 2) {
    notFound();
  }

  const [assets, styleReferences, styles, availableCredits] = await Promise.all([
    db.productAsset.findMany({
      where: {
        id: { in: assetIds },
        userId: session.userId,
        status: "READY",
        archivedAt: null,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
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
    getUserVisibleStyles(),
    getAvailableGenerationCredits(session.userId),
  ]);

  if (assets.length < 2 || styles.length === 0) {
    notFound();
  }

  const displayAssets: BatchSourceAsset[] = assets.map((asset) => ({
    id: asset.id,
    fileUrl: storagePublicUrl(asset.storageKey),
    title: asset.title,
    originalName: asset.originalName,
    productType: asset.productType,
  }));
  const displayStyleReferences: BatchStyleReference[] = styleReferences.map((asset) => ({
    id: asset.id,
    fileUrl: storagePublicUrl(asset.storageKey),
    title: asset.title,
    originalName: asset.originalName,
  }));

  return (
    <GalleryBatchNewScreen
      assets={displayAssets}
      styleReferences={displayStyleReferences}
      styles={styles}
      availableCredits={availableCredits}
      error={params?.error}
      action={createBatchFromGalleryAction}
    />
  );
}
