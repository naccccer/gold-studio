"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { buildVisionPromptContext } from "@/lib/ai/vision";
import { requireUserSession } from "@/lib/auth/session";
import {
  attachGenerationCreditReservation,
  getAvailableGenerationCredits,
  NO_CREDITS_ERROR,
  releaseGenerationCreditReservation,
  reserveGenerationCredit,
} from "@/lib/billing";
import { db } from "@/lib/db";
import { processGenerationBatch } from "@/lib/generation/jobs";
import { getOutputPresetSpec, normalizeOutputPreset } from "@/lib/output-presets";
import { analyzeAndStoreProductAssetVision, ensureProductAssetVision, pickVisionTitle } from "@/lib/product-vision";
import { isProductType } from "@/lib/product-types";
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
    const asset = await db.productAsset.create({
      data: {
        userId: session.userId,
        fileUrl: uploaded.publicUrl,
        storageKey: uploaded.storageKey,
        mimeType: uploaded.mimeType,
        originalName: uploaded.originalName,
        title: null,
      },
    });
    const analyzed = await analyzeAndStoreProductAssetVision(asset.id);
    if (analyzed?.visionShortTitle) {
      await db.productAsset.update({
        where: { id: asset.id },
        data: { title: analyzed.visionShortTitle },
      });
    }
  }

  redirect("/gallery");
}

export async function createBatchFromGalleryAction(formData: FormData) {
  const session = await requireUserSession();
  const assetIds = Array.from(new Set(formData.getAll("assetIds").map(String).filter(Boolean)));
  const styleId = String(formData.get("styleId") ?? "");
  const outputPreset = normalizeOutputPreset(formData.get("outputPreset"));
  const style = await getStyleForGeneration(styleId);

  if (assetIds.length < 2 || !style) {
    redirect("/gallery");
  }

  const assets = await db.productAsset.findMany({
    where: {
      id: { in: assetIds },
      userId: session.userId,
      status: "READY",
      archivedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  if (assets.length < 2) {
    redirect("/gallery");
  }

  const availableCredits = await getAvailableGenerationCredits(session.userId);
  if (availableCredits < assets.length) {
    redirect(`/gallery/batches/new?assetIds=${encodeURIComponent(assetIds.join(","))}&error=${encodeURIComponent(NO_CREDITS_ERROR)}`);
  }

  const reservations: string[] = [];
  const batch = await db.generationBatch.create({
    data: {
      userId: session.userId,
      title: `${assets.length} تصویر`,
      styleId: style.id,
      outputPreset,
      status: "QUEUED",
    },
    select: { id: true },
  });

  try {
    for (const asset of assets) {
      const reservation = await reserveGenerationCredit({ userId: session.userId, batchId: batch.id });
      if (!reservation.ok) {
        throw new Error(reservation.error);
      }
      reservations.push(reservation.reservationId);

      const analyzedAsset = await ensureProductAssetVision(asset.id);
      const visionContext = buildVisionPromptContext({
        productType: analyzedAsset?.productType,
        visionDescription: analyzedAsset?.visionDescription,
        visionConfidence: analyzedAsset?.visionConfidence,
      });
      const project = await db.project.create({
        data: {
          userId: session.userId,
          sourceAssetId: asset.id,
          title: pickVisionTitle({
            userTitle: asset.title,
            visionShortTitle: analyzedAsset?.visionShortTitle,
            fallbackTitle: asset.originalName,
          }),
          sourceImageUrl: asset.fileUrl,
          outputPreset,
          styleId: style.id,
          prompt: [style.prompt, getOutputPresetSpec(outputPreset).instruction, visionContext].filter(Boolean).join("\n"),
          status: "QUEUED",
        },
        select: { id: true },
      });

      await attachGenerationCreditReservation({
        reservationId: reservation.reservationId,
        projectId: project.id,
        batchId: batch.id,
      });

      await db.generationBatchItem.create({
        data: {
          batchId: batch.id,
          assetId: asset.id,
          projectId: project.id,
        },
      });
    }
  } catch (error) {
    await Promise.all(reservations.map((reservationId) => releaseGenerationCreditReservation({ reservationId })));
    await db.generationBatch.delete({ where: { id: batch.id } }).catch(() => undefined);
    redirect(
      `/gallery/batches/new?assetIds=${encodeURIComponent(assetIds.join(","))}&error=${encodeURIComponent(
        error instanceof Error ? error.message : NO_CREDITS_ERROR,
      )}`,
    );
  }

  after(() => processGenerationBatch(batch.id));
  redirect(`/gallery/batches/${batch.id}`);
}

export async function renameAssetAction(formData: FormData) {
  const session = await requireUserSession();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!assetId || title.length === 0 || title.length > 80) {
    return;
  }

  await db.productAsset.updateMany({
    where: { id: assetId, userId: session.userId, status: "READY", archivedAt: null },
    data: { title },
  });

  revalidatePath("/gallery");
}

export async function updateAssetProductTypeAction(formData: FormData) {
  const session = await requireUserSession();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const productType = String(formData.get("productType") ?? "").trim();

  if (!assetId || !isProductType(productType)) {
    return;
  }

  await db.productAsset.updateMany({
    where: { id: assetId, userId: session.userId, status: "READY", archivedAt: null },
    data: { productType },
  });

  revalidatePath("/gallery");
  revalidatePath(`/gallery/${assetId}`);
}

export async function archiveAssetAction(formData: FormData) {
  const session = await requireUserSession();
  const assetIds = formData.getAll("assetId").map(String).map((id) => id.trim()).filter(Boolean);

  if (assetIds.length === 0) {
    return;
  }

  await db.productAsset.updateMany({
    where: { id: { in: assetIds }, userId: session.userId, status: "READY", archivedAt: null },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });

  revalidatePath("/gallery");
  revalidatePath("/dashboard");
}
