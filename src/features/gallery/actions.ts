"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { processGenerationBatch } from "@/lib/generation/jobs";
import { getStyleForGeneration } from "@/lib/styles";
import { saveUploadedFile } from "@/lib/uploads";

export async function uploadGalleryAssetsAction(formData: FormData) {
  const session = await requireUserSession();
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    redirect("/gallery");
  }

  for (const file of files) {
    const uploaded = await saveUploadedFile(file);
    await db.productAsset.create({
      data: {
        userId: session.userId,
        fileUrl: uploaded.publicUrl,
        storageKey: uploaded.storageKey,
        mimeType: uploaded.mimeType,
        originalName: uploaded.originalName,
        title: uploaded.originalName,
      },
    });
  }

  redirect("/gallery");
}

export async function createBatchFromGalleryAction(formData: FormData) {
  const session = await requireUserSession();
  const assetIds = formData.getAll("assetIds").map(String).filter(Boolean);
  const styleId = String(formData.get("styleId") ?? "");
  const outputPreset = String(formData.get("outputPreset") ?? "post");
  const style = await getStyleForGeneration(styleId);

  if (assetIds.length === 0 || !style) {
    redirect("/gallery");
  }

  const assets = await db.productAsset.findMany({
    where: {
      id: { in: assetIds },
      userId: session.userId,
      status: "READY",
    },
    orderBy: { createdAt: "asc" },
  });

  if (assets.length === 0) {
    redirect("/gallery");
  }

  const batch = await db.generationBatch.create({
    data: {
      userId: session.userId,
      title: `${assets.length} تصویر`,
      styleId: style.id,
      outputPreset,
      status: "QUEUED",
    },
  });

  for (const asset of assets) {
    const project = await db.project.create({
      data: {
        userId: session.userId,
        sourceAssetId: asset.id,
        title: asset.title || asset.originalName || null,
        sourceImageUrl: asset.fileUrl,
        styleId: style.id,
        prompt: `${style.prompt}\nOutput preset: ${outputPreset}.`,
        status: "QUEUED",
      },
    });

    await db.generationBatchItem.create({
      data: {
        batchId: batch.id,
        assetId: asset.id,
        projectId: project.id,
      },
    });
  }

  after(() => processGenerationBatch(batch.id));
  redirect(`/gallery/batches/${batch.id}`);
}
