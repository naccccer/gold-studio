"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sampleReferenceStyleIdForVertical } from "@/lib/ai/style-policy";
import { requireUserSession } from "@/lib/auth/session";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getReadyStyleReferenceSample } from "@/lib/ready-style-reference-samples";
import { deleteStorageObject } from "@/lib/storage";
import { createOrFindStyleReferenceFromReadySample } from "@/lib/style-reference-ready-samples";
import { saveStyleReferenceFile } from "@/lib/uploads";

export async function uploadStyleReferenceAction(formData: FormData) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
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
        vertical,
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
  const vertical = await getCurrentVertical();
  const sampleId = String(formData.get("sampleId") ?? "").trim();
  const sample = await getReadyStyleReferenceSample(sampleId, vertical);

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

  const asset = await createOrFindStyleReferenceFromReadySample(session.userId, sample.id, vertical);

  if ("error" in asset) {
    redirect(`/account/style-references?error=${encodeURIComponent(asset.error)}`);
  }

  redirect(`/projects/new?styleId=${sampleReferenceStyleIdForVertical(vertical)}&referenceAssetId=${asset.id}`);
}

export async function renameStyleReferenceAction(formData: FormData) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!assetId || title.length === 0 || title.length > 80) {
    return;
  }

  await db.styleReferenceAsset.updateMany({
    where: { id: assetId, userId: session.userId, vertical, status: "READY", archivedAt: null },
    data: { title },
  });

  revalidatePath("/account/style-references");
}

export async function archiveStyleReferenceAction(formData: FormData) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const assetIds = formData.getAll("assetId").map(String).map((id) => id.trim()).filter(Boolean);

  if (assetIds.length === 0) {
    return;
  }

  const assets = await db.styleReferenceAsset.findMany({
    where: { id: { in: assetIds }, userId: session.userId, vertical, status: "READY", archivedAt: null },
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
        vertical,
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
        vertical,
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
