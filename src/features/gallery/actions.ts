"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { buildStyleControlPrompt } from "@/lib/ai/style-controls";
import { buildVisionPromptContext } from "@/lib/ai/vision";
import { requireUserSession } from "@/lib/auth/session";
import {
  attachGenerationCreditReservation,
  getAvailableGenerationCredits,
  releaseGenerationCreditReservation,
  reserveGenerationCredit,
} from "@/lib/billing";
import { NO_CREDITS_ERROR } from "@/lib/credits";
import { db } from "@/lib/db";
import { processGenerationBatch } from "@/lib/generation/jobs";
import { getOutputPresetSpec, normalizeOutputPreset } from "@/lib/output-presets";
import { analyzeAndStoreProductAssetVision, ensureProductAssetVision, pickVisionTitle } from "@/lib/product-vision";
import { normalizeProductType } from "@/lib/product-types";
import { checkRateLimit } from "@/lib/rate-limit";
import { deleteStorageObject } from "@/lib/storage";
import { getStyleForGeneration } from "@/lib/styles";
import { buildSampleReferencePromptContext } from "@/lib/style-reference-vision";
import { saveStyleReferenceFile, saveStyleReferenceFromStoredObject, saveUploadedFile } from "@/lib/uploads";

function getEditorialBackgroundDecorInstruction(styleId: string) {
  if (styleId !== "style_soft_editorial") {
    return "";
  }

  return "Editorial background decor: always include a restrained designed background decor element such as simple geometric volume, matte stone plane, soft fabric plane, plinth, or subtle editorial surface layering. Keep it premium, uncluttered, product-first, and avoid a plain empty catalog background.";
}

async function resolveReferenceAssetForBatch(styleId: string, formData: FormData, userId: string) {
  if (styleId !== "style_sample_reference") {
    return null;
  }

  const referenceAssetId = String(formData.get("referenceAssetId") ?? "").trim();
  if (referenceAssetId) {
    const referenceAsset = await db.styleReferenceAsset.findFirst({
      where: { id: referenceAssetId, userId, status: "READY", archivedAt: null },
      select: { id: true },
    });

    if (!referenceAsset) {
      throw new Error("عکس نمونه انتخاب‌شده پیدا نشد. دوباره از گالری نمونه‌ها انتخاب کنید.");
    }

    return { id: referenceAsset.id };
  }

  const referenceImage = formData
    .getAll("referenceImage")
    .find((value): value is File => value instanceof File && value.size > 0);

  if (!referenceImage) {
    throw new Error("برای سبک عکس نمونه، انتخاب یا آپلود یک عکس نمونه لازم است.");
  }

  const uploaded = await saveStyleReferenceFile(referenceImage);
  return db.styleReferenceAsset.create({
    data: {
      userId,
      fileUrl: uploaded.publicUrl,
      storageKey: uploaded.storageKey,
      mimeType: uploaded.mimeType,
      originalName: uploaded.originalName,
      title: null,
    },
    select: { id: true },
  });
}

export async function uploadGalleryAssetsAction(formData: FormData) {
  const session = await requireUserSession();
  const limited = await checkRateLimit({
    scope: "gallery:bulk-upload",
    identifier: session.userId,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    redirect(`/gallery?error=${encodeURIComponent(limited.error)}`);
  }

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
  const limited = await checkRateLimit({
    scope: "generation:batch",
    identifier: session.userId,
    limit: 6,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    redirect(`/gallery?error=${encodeURIComponent(limited.error)}`);
  }

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

  let referenceAsset: { id: string } | null = null;
  try {
    referenceAsset = await resolveReferenceAssetForBatch(style.id, formData, session.userId);
  } catch (error) {
    redirect(
      `/gallery/batches/new?assetIds=${encodeURIComponent(assetIds.join(","))}&error=${encodeURIComponent(
        error instanceof Error ? error.message : "انتخاب عکس نمونه کامل نشد.",
      )}`,
    );
  }

  const availableCredits = await getAvailableGenerationCredits(session.userId);
  if (availableCredits < assets.length) {
    redirect(`/gallery/batches/new?assetIds=${encodeURIComponent(assetIds.join(","))}&error=${encodeURIComponent(NO_CREDITS_ERROR)}`);
  }

  const reservations: string[] = [];
  const styleControlPrompt = buildStyleControlPrompt(style, formData);
  const batch = await db.generationBatch.create({
    data: {
      userId: session.userId,
      title: `${assets.length} تصویر`,
      styleId: style.id,
      referenceAssetId: referenceAsset?.id ?? null,
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
      const submittedProductType = normalizeProductType(formData.get(`productType_${asset.id}`));
      if (asset.productType !== submittedProductType) {
        await db.productAsset.updateMany({
          where: { id: asset.id, userId: session.userId, status: "READY", archivedAt: null },
          data: { productType: submittedProductType },
        });
      }
      const visionContext = buildVisionPromptContext({
        productType: submittedProductType || analyzedAsset?.productType,
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
          referenceAssetId: referenceAsset?.id ?? null,
          prompt: [
            style.prompt,
            getOutputPresetSpec(outputPreset).instruction,
            styleControlPrompt,
            style.id === "style_sample_reference" ? buildSampleReferencePromptContext() : "",
            getEditorialBackgroundDecorInstruction(style.id),
            visionContext,
          ].filter(Boolean).join("\n"),
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

export async function saveGalleryAssetAsStyleReferenceAction(formData: FormData) {
  const session = await requireUserSession();
  const assetId = String(formData.get("assetId") ?? "").trim();

  if (!assetId) {
    return;
  }

  const asset = await db.productAsset.findFirst({
    where: { id: assetId, userId: session.userId, status: "READY", archivedAt: null },
    select: {
      storageKey: true,
      mimeType: true,
      originalName: true,
      title: true,
    },
  });

  if (!asset) {
    return;
  }

  const copied = await saveStyleReferenceFromStoredObject({
    storageKey: asset.storageKey,
    mimeType: asset.mimeType,
    originalName: asset.originalName,
  });

  await db.styleReferenceAsset.create({
    data: {
      userId: session.userId,
      fileUrl: copied.publicUrl,
      storageKey: copied.storageKey,
      mimeType: copied.mimeType,
      originalName: copied.originalName,
      title: asset.title,
    },
  });

  revalidatePath("/account/style-references");
}

export async function updateAssetProductTypeAction(formData: FormData) {
  const session = await requireUserSession();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const productType = normalizeProductType(formData.get("productType"));

  if (!assetId) {
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

  const assets = await db.productAsset.findMany({
    where: { id: { in: assetIds }, userId: session.userId, status: "READY", archivedAt: null },
    select: {
      id: true,
      storageKey: true,
      _count: {
        select: { batchItems: true, projects: true, supportingProjects: true },
      },
    },
  });

  const deletableAssets = assets.filter((asset) => asset._count.projects === 0 && asset._count.batchItems === 0 && asset._count.supportingProjects === 0);
  const usedAssets = assets.filter((asset) => asset._count.projects > 0 || asset._count.batchItems > 0 || asset._count.supportingProjects > 0);

  if (deletableAssets.length > 0) {
    const deleted = await db.productAsset.deleteMany({
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
            console.error("[gallery-asset-file-delete-failed]", {
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
    await db.productAsset.updateMany({
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

  revalidatePath("/dashboard");
  revalidatePath("/gallery");

  if (usedAssets.length > 0) {
    redirect(
      `/gallery?deleteNotice=${deletableAssets.length > 0 ? "partial" : "archived"}&undoAssetIds=${encodeURIComponent(
        usedAssets.map((asset) => asset.id).join(","),
      )}`,
    );
  }

  redirect("/gallery?deleteNotice=deleted");
}

export async function restoreGalleryAssetsAction(formData: FormData) {
  const session = await requireUserSession();
  const assetIds = formData.getAll("assetId").map(String).map((id) => id.trim()).filter(Boolean);

  if (assetIds.length === 0) {
    return;
  }

  await db.productAsset.updateMany({
    where: {
      id: { in: assetIds },
      userId: session.userId,
      status: "ARCHIVED",
      archivedAt: { not: null },
    },
    data: {
      status: "READY",
      archivedAt: null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/gallery");
  redirect("/gallery?deleteNotice=restored");
}
