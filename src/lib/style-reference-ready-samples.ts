import "server-only";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getReadyStyleReferenceSample, readReadyStyleReferenceSample } from "@/lib/ready-style-reference-samples";
import { buildStorageKey, saveStorageObject } from "@/lib/storage";

export const READY_SAMPLE_ORIGINAL_NAME_PREFIX = "ready-sample:";

const STYLE_REFERENCE_UPLOAD_DIR = path.join("uploads", "style-references");

export async function createOrFindStyleReferenceFromReadySample(
  userId: string,
  sampleId: string,
): Promise<{ id: string } | { error: string }> {
  const sample = await getReadyStyleReferenceSample(sampleId);

  if (!sample) {
    return { error: "نمونه آماده انتخاب‌شده پیدا نشد." };
  }

  const originalName = `${READY_SAMPLE_ORIGINAL_NAME_PREFIX}${sample.id}.webp`;
  const existing = await db.styleReferenceAsset.findFirst({
    where: {
      userId,
      status: "READY",
      archivedAt: null,
      originalName,
    },
    select: { id: true },
  });

  if (existing) {
    return { id: existing.id };
  }

  try {
    const buffer = await readReadyStyleReferenceSample(sample);
    const storageKey = buildStorageKey(STYLE_REFERENCE_UPLOAD_DIR, "webp");
    const publicUrl = await saveStorageObject({
      buffer,
      contentType: "image/webp",
      key: storageKey,
    });
    const asset = await db.styleReferenceAsset.create({
      data: {
        userId,
        fileUrl: publicUrl,
        storageKey,
        mimeType: "image/webp",
        originalName,
        title: sample.title,
      },
      select: { id: true },
    });

    revalidatePath("/account/style-references");
    revalidatePath("/projects/new");
    revalidatePath("/gallery/batches/new");

    return { id: asset.id };
  } catch (error) {
    console.error("[ready-style-reference-create-failed]", { sampleId, error });
    return { error: "آماده‌سازی این نمونه کامل نشد. دوباره تلاش کنید." };
  }
}
