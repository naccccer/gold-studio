import { db } from "@/lib/db";
import { deleteStorageObject } from "@/lib/storage";

const DEFAULT_TEMP_UPLOAD_TTL_HOURS = 24;
const MAX_CLEANUP_LIMIT = 50;

function parseTempUploadTtlHours() {
  const parsed = Number.parseInt(process.env.GALLERY_TEMP_UPLOAD_TTL_HOURS ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_TEMP_UPLOAD_TTL_HOURS;
  }

  return Math.min(parsed, 24 * 30);
}

export async function cleanupAbandonedGalleryUploads({
  userId,
  limit = 25,
}: {
  userId?: string | null;
  limit?: number;
} = {}) {
  const cutoff = new Date(Date.now() - parseTempUploadTtlHours() * 60 * 60 * 1000);
  const normalizedLimit = Number.isFinite(limit) ? Math.trunc(limit) : 25;
  const safeLimit = Math.min(MAX_CLEANUP_LIMIT, Math.max(1, normalizedLimit));
  const staleAssets = await db.productAsset.findMany({
    where: {
      userId: userId || undefined,
      status: "ARCHIVED",
      archivedAt: { lt: cutoff },
      projects: { none: {} },
      batchItems: { none: {} },
      supportingProjects: { none: {} },
    },
    orderBy: { archivedAt: "asc" },
    take: safeLimit,
    select: {
      id: true,
      storageKey: true,
    },
  });

  let deletedCount = 0;
  for (const asset of staleAssets) {
    const deleted = await db.productAsset.deleteMany({
      where: {
        id: asset.id,
        userId: userId || undefined,
        status: "ARCHIVED",
        archivedAt: { lt: cutoff },
        projects: { none: {} },
        batchItems: { none: {} },
        supportingProjects: { none: {} },
      },
    });

    if (deleted.count === 0) {
      continue;
    }

    deletedCount += deleted.count;
    await deleteStorageObject(asset.storageKey).catch((error) => {
      console.error("[gallery-temp-upload-file-delete-failed]", {
        assetId: asset.id,
        storageKey: asset.storageKey,
        error,
      });
    });
  }

  return { deletedCount };
}
