import { notFound } from "next/navigation";
import { createBatchFromGalleryAction } from "@/features/gallery/actions";
import {
  GalleryBatchNewScreen,
  type BatchSourceAsset,
  type BatchStyleReference,
} from "@/features/gallery/screens/gallery-batch-new-screen";
import { requireUserSession } from "@/lib/auth/session";
import { getAvailableGenerationCredits } from "@/lib/billing";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { getReadyStyleReferenceSamples } from "@/lib/ready-style-reference-samples";
import { storageThumbnailUrl, storageThumbnailUrlFromKeyOrUrl } from "@/lib/storage";
import { READY_SAMPLE_ORIGINAL_NAME_PREFIX } from "@/lib/style-reference-ready-samples";
import { getUserVisibleStyles } from "@/lib/styles";
import { getVerticalContent } from "@/lib/vertical-content";

export default async function NewGalleryBatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ assetIds?: string; error?: string }>;
}) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const content = getVerticalContent(vertical);
  const params = await searchParams;
  const assetIds = Array.from(new Set((params?.assetIds ?? "").split(",").map((id) => id.trim()).filter(Boolean)));

  if (assetIds.length < 2) {
    notFound();
  }

  const [assets, styleReferences, readySamples, styles, availableCredits] = await Promise.all([
    db.productAsset.findMany({
      where: {
        id: { in: assetIds },
        userId: session.userId,
        vertical,
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
      where: { userId: session.userId, vertical, status: "READY", archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        storageKey: true,
        title: true,
        originalName: true,
      },
    }),
    getReadyStyleReferenceSamples(vertical),
    getUserVisibleStyles(vertical),
    getAvailableGenerationCredits(session.userId, vertical),
  ]);

  if (assets.length < 2 || styles.length === 0) {
    notFound();
  }

  const displayAssets: BatchSourceAsset[] = assets.map((asset) => ({
    id: asset.id,
    fileUrl: storageThumbnailUrl(asset.storageKey, "card"),
    title: asset.title,
    originalName: asset.originalName,
    productType: asset.productType,
  }));
  const displayStyleReferences: BatchStyleReference[] = styleReferences
    .filter((asset) => !asset.originalName?.startsWith(READY_SAMPLE_ORIGINAL_NAME_PREFIX))
    .map((asset) => ({
    id: asset.id,
    fileUrl: storageThumbnailUrl(asset.storageKey, "card"),
    title: asset.title,
    originalName: asset.originalName,
  }));

  return (
    <GalleryBatchNewScreen
      assets={displayAssets}
      readyStyleReferences={readySamples.map((sample) => ({
        id: sample.id,
        fileUrl: storageThumbnailUrlFromKeyOrUrl(null, sample.fileUrl, "card") || sample.fileUrl,
        title: sample.title,
        alt: sample.alt,
      }))}
      styleReferences={displayStyleReferences}
      styles={styles}
      vertical={vertical}
      content={content}
      availableCredits={availableCredits}
      requiredCredits={assets.length}
      error={params?.error}
      action={createBatchFromGalleryAction}
    />
  );
}
