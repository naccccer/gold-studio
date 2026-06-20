"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getReadyStyleReferenceSample } from "@/lib/ready-style-reference-samples";
import { buildStorageKey, deleteStorageObject, saveStorageObject } from "@/lib/storage";
import { saveStyleReferenceFile } from "@/lib/uploads";

const READY_SAMPLE_ORIGINAL_NAME_PREFIX = "ready-sample:";
const STYLE_REFERENCE_UPLOAD_DIR = path.join("uploads", "style-references");

export async function uploadStyleReferenceAction(formData: FormData) {
  const session = await requireUserSession();
  const limited = await checkRateLimit({
    scope: "style-reference:upload",
    identifier: session.userId,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    redirect(`/account/style-references?error=${encodeURIComponent(limited.error)}`);
  }

  const image = formData.getAll("image").find((value): value is File => value instanceof File && value.size > 0);
  if (!image) {
    redirect("/account/style-references");
  }

  try {
    const uploaded = await saveStyleReferenceFile(image);
    await db.styleReferenceAsset.create({
      data: {
        userId: session.userId,
        fileUrl: uploaded.publicUrl,
        storageKey: uploaded.storageKey,
        mimeType: uploaded.mimeType,
        originalName: uploaded.originalName,
        title: null,
      },
    });
  } catch (error) {
    redirect(
      `/account/style-references?error=${encodeURIComponent(
        error instanceof Error ? error.message : "آپلود عکس نمونه کامل نشد.",
      )}`,
    );
  }

  revalidatePath("/account/style-references");
  redirect("/account/style-references");
}

export async function createStyleReferenceFromSampleAction(formData: FormData) {
  const session = await requireUserSession();
  const sampleId = String(formData.get("sampleId") ?? "").trim();
  const sample = await getReadyStyleReferenceSample(sampleId);

  if (!sample) {
    redirect("/account/style-references");
  }

  const limited = await checkRateLimit({
    scope: "style-reference:sample",
    identifier: session.userId,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    redirect(`/account/style-references?error=${encodeURIComponent(limited.error)}`);
  }

  const originalName = `${READY_SAMPLE_ORIGINAL_NAME_PREFIX}${sample.id}.webp`;
  const existing = await db.styleReferenceAsset.findFirst({
    where: {
      userId: session.userId,
      status: "READY",
      archivedAt: null,
      originalName,
    },
    select: { id: true },
  });

  if (existing) {
    redirect(`/projects/new?styleId=style_sample_reference&referenceAssetId=${existing.id}`);
  }

  let assetId: string;

  try {
    const buffer = await readFile(sample.filePath);
    const storageKey = buildStorageKey(STYLE_REFERENCE_UPLOAD_DIR, "webp");
    const publicUrl = await saveStorageObject({
      buffer,
      contentType: "image/webp",
      key: storageKey,
    });
    const asset = await db.styleReferenceAsset.create({
      data: {
        userId: session.userId,
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
    assetId = asset.id;
  } catch (error) {
    console.error("[ready-style-reference-create-failed]", { sampleId, error });
    redirect(`/account/style-references?error=${encodeURIComponent("آماده‌سازی این نمونه کامل نشد. دوباره تلاش کنید.")}`);
  }

  redirect(`/projects/new?styleId=style_sample_reference&referenceAssetId=${assetId}`);
}

export async function renameStyleReferenceAction(formData: FormData) {
  const session = await requireUserSession();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!assetId || title.length === 0 || title.length > 80) {
    return;
  }

  await db.styleReferenceAsset.updateMany({
    where: { id: assetId, userId: session.userId, status: "READY", archivedAt: null },
    data: { title },
  });

  revalidatePath("/account/style-references");
}

export async function archiveStyleReferenceAction(formData: FormData) {
  const session = await requireUserSession();
  const assetIds = formData.getAll("assetId").map(String).map((id) => id.trim()).filter(Boolean);

  if (assetIds.length === 0) {
    return;
  }

  const assets = await db.styleReferenceAsset.findMany({
    where: { id: { in: assetIds }, userId: session.userId, status: "READY", archivedAt: null },
    select: {
      id: true,
      storageKey: true,
      _count: {
        select: { batches: true, projects: true },
      },
    },
  });

  const deletableAssets = assets.filter((asset) => asset._count.projects === 0 && asset._count.batches === 0);
  const usedAssets = assets.filter((asset) => asset._count.projects > 0 || asset._count.batches > 0);

  if (deletableAssets.length > 0) {
    const deleted = await db.styleReferenceAsset.deleteMany({
      where: {
        id: { in: deletableAssets.map((asset) => asset.id) },
        userId: session.userId,
        status: "READY",
        archivedAt: null,
      },
    });

    if (deleted.count > 0) {
      await Promise.all(
        deletableAssets.map((asset) =>
          deleteStorageObject(asset.storageKey).catch((error) => {
            console.error("[style-reference-file-delete-failed]", {
              assetId: asset.id,
              storageKey: asset.storageKey,
              error,
            });
          }),
        ),
      );
    }
  }

  if (usedAssets.length > 0) {
    await db.styleReferenceAsset.updateMany({
      where: {
        id: { in: usedAssets.map((asset) => asset.id) },
        userId: session.userId,
        status: "READY",
        archivedAt: null,
      },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });
  }

  revalidatePath("/account/style-references");
  redirect("/account/style-references");
}
