"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUserSession } from "@/lib/auth/session";
import {
  attachGenerationCreditReservation,
  getAvailableGenerationCreditUnits,
  releaseGenerationCreditReservation,
  reserveGenerationCredit,
} from "@/lib/billing";
import { NO_CREDITS_ERROR } from "@/lib/credits";
import { getGenerationCreditUnitCost } from "@/lib/credit-units";
import { db } from "@/lib/db";
import { buildGenerationPrompt } from "@/lib/ai/generation-prompt";
import { getCurrentVertical } from "@/lib/current-vertical";
import { processGenerationBatch } from "@/lib/generation/jobs";
import { normalizeOutputPreset } from "@/lib/output-presets";
import { analyzeAndStoreProductAssetVision, ensureProductAssetVision, pickVisionTitle } from "@/lib/product-vision";
import { DEFAULT_PRODUCT_TYPE, normalizeProductType } from "@/lib/product-types";
import { checkRateLimit } from "@/lib/rate-limit";
import { deleteStorageObject } from "@/lib/storage";
import { createOrFindStyleReferenceFromReadySample } from "@/lib/style-reference-ready-samples";
import { getStyleForGeneration } from "@/lib/styles";
import { saveStyleReferenceFile, saveStyleReferenceFromStoredObject, saveUploadedFile } from "@/lib/uploads";
import type { VerticalId } from "@/lib/verticals";

async function resolveReferenceAssetForBatch(styleId: string, formData: FormData, userId: string, vertical: VerticalId) {
  if (styleId !== "style_sample_reference") {
    return null;
  }

  const referenceAssetId = String(formData.get("referenceAssetId") ?? "").trim();
  if (referenceAssetId) {
    const referenceAsset = await db.styleReferenceAsset.findFirst({
      where: { id: referenceAssetId, userId, vertical, status: "READY", archivedAt: null },
      select: { id: true },
    });

    if (!referenceAsset) {
      throw new Error("عکس نمونه انتخاب‌شده پیدا نشد. دوباره از گالری نمونه‌ها انتخاب کنید.");
    }

    return { id: referenceAsset.id };
  }

  const readySampleId = String(formData.get("readySampleId") ?? "").trim();
  if (readySampleId) {
    const asset = await createOrFindStyleReferenceFromReadySample(userId, readySampleId, vertical);
    if ("error" in asset) {
      throw new Error(asset.error);
    }

    return { id: asset.id };
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
      vertical,
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
  const vertical = await getCurrentVertical();
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
        vertical,
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
  const vertical = await getCurrentVertical();
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
  const style = await getStyleForGeneration(styleId, vertical);

  if (assetIds.length < 2 || !style) {
    redirect("/gallery");
  }

  const assets = await db.productAsset.findMany({
    where: {
      id: { in: assetIds },
      userId: session.userId,
      vertical,
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
    referenceAsset = await resolveReferenceAssetForBatch(style.id, formData, session.userId, vertical);
  } catch (error) {
    redirect(
      `/gallery/batches/new?assetIds=${encodeURIComponent(assetIds.join(","))}&error=${encodeURIComponent(
        error instanceof Error ? error.message : "انتخاب عکس نمونه کامل نشد.",
      )}`,
    );
  }

  const requiredCreditUnits = assets.length * getGenerationCreditUnitCost(vertical);
  const availableCreditUnits = await getAvailableGenerationCreditUnits(session.userId);
  if (availableCreditUnits < requiredCreditUnits) {
    redirect(`/gallery/batches/new?assetIds=${encodeURIComponent(assetIds.join(","))}&error=${encodeURIComponent(NO_CREDITS_ERROR)}`);
  }

  const reservations: string[] = [];
  const createdProjectIds: string[] = [];
  const batch = await db.generationBatch.create({
    data: {
      userId: session.userId,
      vertical,
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
      const reservation = await reserveGenerationCredit({ userId: session.userId, batchId: batch.id, vertical });
      if (!reservation.ok) {
        throw new Error(reservation.error);
      }
      reservations.push(reservation.reservationId);

      const analyzedAsset = await ensureProductAssetVision(asset.id);
      const submittedProductType = normalizeProductType(formData.get(`productType_${asset.id}`));
      const effectiveProductType =
        submittedProductType === DEFAULT_PRODUCT_TYPE && analyzedAsset?.productType
          ? normalizeProductType(analyzedAsset.productType)
          : submittedProductType;
      if (asset.productType !== submittedProductType) {
        await db.productAsset.updateMany({
          where: { id: asset.id, userId: session.userId, vertical, status: "READY", archivedAt: null },
          data: { productType: submittedProductType },
        });
      }
      const projectPrompt = buildGenerationPrompt({
        style,
        formData,
        vision: {
          productType: effectiveProductType,
          visionDescription: analyzedAsset?.visionDescription,
          visionConfidence: analyzedAsset?.visionConfidence,
          visionAngle: analyzedAsset?.visionAngle,
        },
      });
      const project = await db.project.create({
        data: {
          userId: session.userId,
          vertical,
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
          prompt: projectPrompt,
          status: "QUEUED",
        },
        select: { id: true },
      });
      createdProjectIds.push(project.id);

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
    if (createdProjectIds.length > 0) {
      await db.project.updateMany({
        where: {
          id: { in: createdProjectIds },
          userId: session.userId,
          status: "QUEUED",
        },
        data: {
          status: "FAILED",
          errorMessage: "ساخت دسته‌ای کامل نشد و اعتبار رزروشده آزاد شد. لطفا دوباره تلاش کنید.",
        },
      });
    }
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
  const vertical = await getCurrentVertical();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!assetId || title.length === 0 || title.length > 80) {
    return;
  }

  await db.productAsset.updateMany({
    where: { id: assetId, userId: session.userId, vertical, status: "READY", archivedAt: null },
    data: { title },
  });

  revalidatePath("/gallery");
}

export async function saveGalleryAssetAsStyleReferenceAction(formData: FormData) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const assetId = String(formData.get("assetId") ?? "").trim();

  if (!assetId) {
    return;
  }

  const asset = await db.productAsset.findFirst({
    where: { id: assetId, userId: session.userId, vertical, status: "READY", archivedAt: null },
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
      vertical,
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
  const vertical = await getCurrentVertical();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const productType = normalizeProductType(formData.get("productType"));

  if (!assetId) {
    return;
  }

  await db.productAsset.updateMany({
    where: { id: assetId, userId: session.userId, vertical, status: "READY", archivedAt: null },
    data: { productType },
  });

  revalidatePath("/gallery");
  revalidatePath(`/gallery/${assetId}`);
}

export async function archiveAssetAction(formData: FormData) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const assetIds = formData.getAll("assetId").map(String).map((id) => id.trim()).filter(Boolean);

  if (assetIds.length === 0) {
    return;
  }

  const assets = await db.productAsset.findMany({
    where: { id: { in: assetIds }, userId: session.userId, vertical, status: "READY", archivedAt: null },
    select: {
      id: true,
      storageKey: true,
      _count: {
        select: { batchItems: true, projects: true },
      },
    },
  });
  const supportingAssetCounts = await db.projectSupportingAsset.groupBy({
    by: ["assetId"],
    where: { assetId: { in: assets.map((asset) => asset.id) } },
    _count: { assetId: true },
  });
  const supportingAssetCountById = new Map(
    supportingAssetCounts.map((item) => [item.assetId, item._count.assetId]),
  );

  const deletableAssets = assets.filter((asset) => asset._count.projects === 0 && asset._count.batchItems === 0 && (supportingAssetCountById.get(asset.id) ?? 0) === 0);
  const usedAssets = assets.filter((asset) => asset._count.projects > 0 || asset._count.batchItems > 0 || (supportingAssetCountById.get(asset.id) ?? 0) > 0);

  if (deletableAssets.length > 0) {
    const deleted = await db.productAsset.deleteMany({
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
  const vertical = await getCurrentVertical();
  const assetIds = formData.getAll("assetId").map(String).map((id) => id.trim()).filter(Boolean);

  if (assetIds.length === 0) {
    return;
  }

  await db.productAsset.updateMany({
    where: {
      id: { in: assetIds },
      userId: session.userId,
      vertical,
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
