"use server";

import { redirect } from "next/navigation";
import { generateStyledImageWithGapGpt } from "@/lib/ai/gapgpt";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getStyleForGeneration } from "@/lib/styles";
import { readStoredUpload, saveGeneratedImage, saveUploadedFile } from "@/lib/uploads";

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
  const stylePresetId = String(formData.get("stylePreset") ?? "CLEAN_WHITE");
  const outputPreset = String(formData.get("outputPreset") ?? "post");
  const stylePreset = await getStyleForGeneration(stylePresetId);

  if (assetIds.length === 0 || !stylePreset) {
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
      stylePreset: stylePreset.preset,
      outputPreset,
      status: "PENDING",
    },
  });

  let completedCount = 0;

  for (const asset of assets) {
    const project = await db.project.create({
      data: {
        userId: session.userId,
        sourceAssetId: asset.id,
        title: asset.title || asset.originalName || null,
        sourceImageUrl: asset.fileUrl,
        stylePreset: stylePreset.preset,
        prompt: `${stylePreset.prompt}\nOutput preset: ${outputPreset}.`,
        status: "PENDING",
      },
    });

    await db.generationBatchItem.create({
      data: {
        batchId: batch.id,
        assetId: asset.id,
        projectId: project.id,
      },
    });

    try {
      const source = await readStoredUpload(asset.storageKey, asset.mimeType);
      const generatedImage = await generateStyledImageWithGapGpt({
        sourceBuffer: source.buffer,
        mimeType: source.mimeType,
        stylePrompt: `${stylePreset.prompt}\nOutput preset: ${outputPreset}.`,
      });
      const resultImageUrl = await saveGeneratedImage(generatedImage.imageBuffer);

      await db.project.update({
        where: { id: project.id },
        data: { status: "COMPLETED", resultImageUrl, errorMessage: null },
      });
      completedCount += 1;
    } catch (error) {
      await db.project.update({
        where: { id: project.id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "خطا در تولید دسته‌ای رخ داد.",
        },
      });
    }
  }

  await db.generationBatch.update({
    where: { id: batch.id },
    data: { status: completedCount > 0 ? "COMPLETED" : "FAILED" },
  });

  redirect(`/gallery/batches/${batch.id}`);
}
