"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import {
  attachGenerationCreditReservation,
  releaseGenerationCreditReservation,
  reserveGenerationCredit,
  reserveGenerationCreditInTransaction,
} from "@/lib/billing";
import { FREE_VARIANT_LIMIT } from "@/lib/credits";
import { buildGenerationPrompt } from "@/lib/ai/generation-prompt";
import { processImageProject, processTextProject } from "@/lib/generation/jobs";
import { normalizeOutputPreset } from "@/lib/output-presets";
import { pickVisionTitle, retryProjectVisionTitle } from "@/lib/product-vision";
import { normalizeProductType } from "@/lib/product-types";
import { checkRateLimit } from "@/lib/rate-limit";
import { deleteStorageObject, readStorageObject } from "@/lib/storage";
import { getStyleForGeneration } from "@/lib/styles";
import {
  saveStyleReferenceFile,
  saveStyleReferenceFromStoredObject,
  saveTextPromptSourceImage,
  saveUploadedFile,
} from "@/lib/uploads";

export type ProjectFormState = {
  error?: string;
};

const MAX_SUPPORTING_PRODUCT_IMAGES = 2;

class RetryProjectClaimLostError extends Error {
  constructor() {
    super("Retry project claim was lost.");
  }
}

async function getReadyUser(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { error: "کاربر یافت نشد. دوباره وارد شوید." };
  }

  return { user };
}

function supportingAssetIdsFromFormData(formData: FormData, sourceAssetId?: string | null) {
  const seen = new Set<string>();
  const sourceId = sourceAssetId?.trim() || "";
  const ids: string[] = [];

  for (const value of formData.getAll("supportingAssetId")) {
    const id = String(value).trim();
    if (!id || id === sourceId || seen.has(id)) {
      continue;
    }

    seen.add(id);
    ids.push(id);
  }

  return ids;
}

async function resolveSupportingAssets(formData: FormData, userId: string, sourceAssetId?: string | null) {
  const supportingAssetIds = supportingAssetIdsFromFormData(formData, sourceAssetId);
  if (supportingAssetIds.length > MAX_SUPPORTING_PRODUCT_IMAGES) {
    return { error: "برای هر پروژه حداکثر دو عکس تکمیلی می‌توانید اضافه کنید." };
  }

  if (supportingAssetIds.length === 0) {
    return { assets: [] as Array<{ id: string }> };
  }

  const assets = await db.productAsset.findMany({
    where: {
      id: { in: supportingAssetIds },
      userId,
      status: "READY",
      archivedAt: null,
    },
    select: { id: true },
  });
  const assetIds = new Set(assets.map((asset) => asset.id));
  const orderedAssets = supportingAssetIds.flatMap((id) => (assetIds.has(id) ? [{ id }] : []));

  if (orderedAssets.length !== supportingAssetIds.length) {
    return { error: "یکی از عکس‌های تکمیلی پیدا نشد یا آماده استفاده نیست." };
  }

  return { assets: orderedAssets };
}

function supportingAssetCreateData(supportingAssets: Array<{ id: string }>) {
  return supportingAssets.map((asset, index) => ({
    assetId: asset.id,
    position: index + 1,
  }));
}

async function reserveCreditOrState(userId: string) {
  const reservation = await reserveGenerationCredit({ userId });
  if (!reservation.ok) {
    return { ok: false as const, error: reservation.error };
  }

  return { ok: true as const, reservationId: reservation.reservationId };
}

function stripVersionSuffix(title: string) {
  return title.replace(/\s*[-–]\s*نسخه\s+(?:دیگر|[0-9۰-۹٠-٩]+)\s*$/u, "").trim();
}

function versionedProjectTitle(title: string | null, versionNumber: number) {
  const cleanTitle = title?.trim() || "نسخه دیگر";
  const baseTitle = stripVersionSuffix(cleanTitle) || cleanTitle;
  if (versionNumber <= 1) return baseTitle;

  return `${baseTitle} - نسخه ${versionNumber.toLocaleString("fa-IR")}`;
}

async function resolveReferenceAssetForStyle(styleId: string, formData: FormData, userId: string) {
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
      return { error: "عکس نمونه انتخاب‌شده پیدا نشد. دوباره از گالری نمونه‌ها انتخاب کنید." };
    }

    return { id: referenceAsset.id };
  }

  const referenceImage = formData
    .getAll("referenceImage")
    .find((value): value is File => value instanceof File && value.size > 0);

  if (!referenceImage) {
    return { error: "برای سبک عکس نمونه، انتخاب یا آپلود یک عکس نمونه لازم است." };
  }

  const uploaded = await saveStyleReferenceFile(referenceImage);
  const referenceAsset = await db.styleReferenceAsset.create({
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

  return { id: referenceAsset.id };
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await requireUserSession();
  const limited = await checkRateLimit({
    scope: "generation:create",
    identifier: session.userId,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return { error: limited.error };
  }

  const title = String(formData.get("title") ?? "").trim();
  const mode = String(formData.get("generationMode") ?? "image");
  const sourceAssetId = String(formData.get("sourceAssetId") ?? "").trim();
  const freeVariantParentId = String(formData.get("freeVariantParentId") ?? "").trim();
  const submittedProductType = String(formData.get("productType") ?? "").trim();
  const selectedProductType = normalizeProductType(submittedProductType);
  const outputPreset = normalizeOutputPreset(formData.get("outputPreset"));
  const styleId = String(formData.get("styleId") ?? "");
  const style = await getStyleForGeneration(styleId);

  if (!style) {
    return { error: "سبک انتخاب‌شده معتبر نیست." };
  }

  const referenceAsset = await resolveReferenceAssetForStyle(style.id, formData, session.userId);
  if (referenceAsset && "error" in referenceAsset) {
    return { error: referenceAsset.error };
  }

  const readyUser = await getReadyUser(session.userId);
  if ("error" in readyUser) {
    return readyUser;
  }

  const stylePrompt = buildGenerationPrompt({ style, formData });

  if (mode === "text") {
    if (session.role !== "ADMIN") {
      return { error: "این قابلیت فقط در بخش ادمین در دسترس است." };
    }

    const textPrompt = String(formData.get("textPrompt") ?? "").trim();
    if (textPrompt.length < 3) {
      return { error: "برای اجرای تست داخلی، یک ورودی کوتاه ثبت کنید." };
    }

    const reserved = await reserveCreditOrState(session.userId);
    if (!reserved.ok) {
      return { error: reserved.error };
    }

    let project: { id: string };
    try {
      const sourceImageUrl = await saveTextPromptSourceImage(textPrompt);
      project = await db.project.create({
      data: {
        userId: session.userId,
        title: title || "تست داخلی متن به تصویر",
        sourceImageUrl,
        outputPreset,
        styleId: style.id,
        prompt: `${textPrompt}\n\n${stylePrompt}`,
        status: "QUEUED",
      },
        select: { id: true },
      });
      await attachGenerationCreditReservation({ reservationId: reserved.reservationId, projectId: project.id });
    } catch (error) {
      await releaseGenerationCreditReservation({ reservationId: reserved.reservationId });
      throw error;
    }

    after(() => processTextProject({ projectId: project.id, textPrompt, stylePrompt }));
    redirect(`/projects/${project.id}`);
  }

  if (sourceAssetId) {
    const asset = await db.productAsset.findFirst({
      where: { id: sourceAssetId, userId: session.userId, status: "READY", archivedAt: null },
    });

    if (!asset) {
      return { error: "تصویر گالری یافت نشد." };
    }

    const supportingAssets = await resolveSupportingAssets(formData, session.userId, asset.id);
    if ("error" in supportingAssets) {
      return { error: supportingAssets.error };
    }
    const supportingCreateData = supportingAssetCreateData(supportingAssets.assets);

    const projectPrompt = buildGenerationPrompt({
      style,
      formData,
      vision: {
        productType: selectedProductType,
        visionDescription: asset.visionDescription,
        visionConfidence: asset.visionConfidence,
        visionAngle: asset.visionAngle,
      },
      productImageCount: 1 + supportingAssets.assets.length,
    });

    const projectTitle = pickVisionTitle({
      userTitle: title,
      visionShortTitle: asset.visionShortTitle,
      fallbackTitle: asset.title || asset.originalName,
    });
    let project: { id: string };
    let reservationId: string | null = null;
    const freeVariantId = freeVariantParentId ? randomUUID() : null;

    try {
      if (freeVariantParentId) {
        const freeVariant = await db.$transaction(async (tx) => {
          const parent = await tx.project.findFirst({
            where: {
              id: freeVariantParentId,
              userId: session.userId,
              status: "COMPLETED",
              sourceAssetId: asset.id,
              archivedAt: null,
              variantParentId: null,
              freeVariantProjectId: null,
            },
            select: { id: true },
          });

          if (!parent || !freeVariantId) {
            return null;
          }

          const usedFreeVariants = await tx.project.count({
            where: {
              userId: session.userId,
              variantParentId: parent.id,
              archivedAt: null,
              status: "COMPLETED",
            },
          });

          if (usedFreeVariants >= FREE_VARIANT_LIMIT) {
            return null;
          }

          const claimed = await tx.project.updateMany({
            where: {
              id: parent.id,
              userId: session.userId,
              status: "COMPLETED",
              sourceAssetId: asset.id,
              archivedAt: null,
              variantParentId: null,
              freeVariantProjectId: null,
            },
            data: { freeVariantProjectId: freeVariantId },
          });

          if (claimed.count === 0) {
            return null;
          }

          if (asset.productType !== selectedProductType) {
            await tx.productAsset.updateMany({
              where: { id: asset.id, userId: session.userId, status: "READY", archivedAt: null },
              data: { productType: selectedProductType },
            });
          }

          const existingCount = await tx.project.count({
            where: { userId: session.userId, sourceAssetId: asset.id, archivedAt: null },
          });

          return tx.project.create({
            data: {
              id: freeVariantId,
              userId: session.userId,
              sourceAssetId: asset.id,
              title: versionedProjectTitle(projectTitle, existingCount + 1),
              sourceImageUrl: asset.fileUrl,
              outputPreset,
              styleId: style.id,
              referenceAssetId: referenceAsset?.id ?? null,
              prompt: projectPrompt,
              status: "QUEUED",
              variantParentId: parent.id,
              supportingAssets: supportingCreateData.length > 0 ? { create: supportingCreateData } : undefined,
            },
            select: { id: true },
          });
        });

        if (freeVariant) {
          project = freeVariant;
        } else {
          return { error: "فرصت رایگان این پروژه دیگر در دسترس نیست. دوباره از صفحه نتیجه اقدام کنید یا نسخه عادی بسازید." };
        }
      } else {
        const reserved = await reserveCreditOrState(session.userId);
        if (!reserved.ok) {
          return { error: reserved.error };
        }
        reservationId = reserved.reservationId;
        if (asset.productType !== selectedProductType) {
          await db.productAsset.updateMany({
            where: { id: asset.id, userId: session.userId, status: "READY", archivedAt: null },
            data: { productType: selectedProductType },
          });
        }
        const existingCount = await db.project.count({
          where: { userId: session.userId, sourceAssetId: asset.id, archivedAt: null },
        });

        project = await db.project.create({
          data: {
            userId: session.userId,
            sourceAssetId: asset.id,
            title: versionedProjectTitle(projectTitle, existingCount + 1),
            sourceImageUrl: asset.fileUrl,
            outputPreset,
            styleId: style.id,
            referenceAssetId: referenceAsset?.id ?? null,
            prompt: projectPrompt,
            status: "QUEUED",
            supportingAssets: supportingCreateData.length > 0 ? { create: supportingCreateData } : undefined,
          },
          select: { id: true },
        });
        await attachGenerationCreditReservation({ reservationId, projectId: project.id });
      }
    } catch (error) {
      if (reservationId) {
        await releaseGenerationCreditReservation({ reservationId });
      }

      throw error;
    }

    if (!project) {
      return { error: "ساخت پروژه کامل نشد. دوباره تلاش کنید." };
    }

    if (!asset.visionAnalyzedAt) {
      after(() => retryProjectVisionTitle(project.id, session.userId, { forceAnalyze: true }));
    }
    after(() => processImageProject(project.id));
    redirect(`/projects/${project.id}`);
  }

  const image = formData.getAll("image").find((value): value is File => value instanceof File && value.size > 0);
  if (!(image instanceof File) || image.size === 0) {
    return { error: "لطفا تصویر محصول را انتخاب کنید." };
  }

  const reserved = await reserveCreditOrState(session.userId);
  if (!reserved.ok) {
    return { error: reserved.error };
  }

  let asset: { id: string };
  let project: { id: string };
  try {
    const uploaded = await saveUploadedFile(image);
    asset = await db.productAsset.create({
      data: {
        userId: session.userId,
        fileUrl: uploaded.publicUrl,
        storageKey: uploaded.storageKey,
        mimeType: uploaded.mimeType,
        originalName: uploaded.originalName,
        title: title || null,
        productType: selectedProductType,
      },
      select: { id: true },
    });
    const projectPrompt = buildGenerationPrompt({
      style,
      formData,
      vision: {
        productType: selectedProductType,
        visionDescription: null,
        visionConfidence: null,
        visionAngle: null,
      },
    });

    project = await db.project.create({
      data: {
        userId: session.userId,
        sourceAssetId: asset.id,
        title: pickVisionTitle({
          userTitle: title,
          visionShortTitle: null,
          fallbackTitle: uploaded.originalName,
        }),
        sourceImageUrl: uploaded.publicUrl,
        outputPreset,
        styleId: style.id,
        referenceAssetId: referenceAsset?.id ?? null,
        prompt: projectPrompt,
        status: "QUEUED",
      },
      select: { id: true },
    });
    await attachGenerationCreditReservation({ reservationId: reserved.reservationId, projectId: project.id });
  } catch (error) {
    await releaseGenerationCreditReservation({ reservationId: reserved.reservationId });
    throw error;
  }

  after(async () => {
    await retryProjectVisionTitle(project.id, session.userId, { forceAnalyze: true });
  });
  after(() => processImageProject(project.id));
  redirect(`/projects/${project.id}`);
}

export async function renameProjectAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!projectId || title.length === 0 || title.length > 80) {
    return;
  }

  await db.project.updateMany({
    where: { id: projectId, userId: session.userId, archivedAt: null },
    data: { title },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function saveProjectResultAsStyleReferenceAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.userId, status: "COMPLETED", archivedAt: null },
    select: {
      title: true,
      resultStorageKey: true,
    },
  });

  if (!project?.resultStorageKey) {
    return;
  }

  const copied = await saveStyleReferenceFromStoredObject({
    storageKey: project.resultStorageKey,
    mimeType: "image/png",
    originalName: project.title ? `${project.title}.png` : "project-result.png",
  });

  await db.styleReferenceAsset.create({
    data: {
      userId: session.userId,
      fileUrl: copied.publicUrl,
      storageKey: copied.storageKey,
      mimeType: copied.mimeType,
      originalName: copied.originalName,
      title: project.title,
    },
  });

  revalidatePath("/account/style-references");
}

export async function updateProjectProductTypeAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const productType = normalizeProductType(formData.get("productType"));

  if (!projectId) {
    return;
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.userId, archivedAt: null },
    select: { sourceAssetId: true },
  });

  if (!project?.sourceAssetId) {
    return;
  }

  await db.productAsset.updateMany({
    where: { id: project.sourceAssetId, userId: session.userId, status: "READY", archivedAt: null },
    data: { productType },
  });

  revalidatePath("/gallery");
  revalidatePath(`/projects/${projectId}`);
}

export async function archiveProjectAction(formData: FormData) {
  const session = await requireUserSession();
  const projectIds = formData.getAll("projectId").map(String).map((id) => id.trim()).filter(Boolean);

  if (projectIds.length === 0) {
    return;
  }

  await db.project.updateMany({
    where: { id: { in: projectIds }, userId: session.userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function restoreProjectAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  await db.project.updateMany({
    where: { id: projectId, userId: session.userId, archivedAt: { not: null } },
    data: { archivedAt: null },
  });

  revalidatePath("/account/archive");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function deleteArchivedProjectAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.userId, archivedAt: { not: null } },
    select: { id: true, resultStorageKey: true },
  });

  if (!project) {
    return;
  }

  const resultStorageKey = project.resultStorageKey?.trim() || null;
  const sharedResultCount = resultStorageKey
    ? await db.project.count({
        where: {
          id: { not: project.id },
          resultStorageKey,
        },
      })
    : 0;

  await db.project.delete({ where: { id: project.id } });

  if (resultStorageKey && sharedResultCount === 0) {
    after(() =>
      deleteStorageObject(resultStorageKey).catch((error) => {
        console.error("[project-result-file-delete-failed]", {
          projectId: project.id,
          storageKey: resultStorageKey,
          error,
        });
      }),
    );
  }

  revalidatePath("/account/archive");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/account/archive");
}

export async function retryProjectAction(formData: FormData) {
  const session = await requireUserSession();
  const limited = await checkRateLimit({
    scope: "generation:retry",
    identifier: session.userId,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    redirect(`/billing?error=${encodeURIComponent(limited.error)}`);
  }

  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.userId, status: { in: ["FAILED", "COMPLETED"] }, archivedAt: null },
    select: { id: true, sourceAssetId: true, status: true, resultImageUrl: true, resultStorageKey: true },
  });

  if (!project?.sourceAssetId) {
    return;
  }

  if (project.status === "COMPLETED") {
    if (!project.resultStorageKey && project.resultImageUrl) {
      return;
    }

    if (project.resultStorageKey) {
      try {
        await readStorageObject(project.resultStorageKey, "application/octet-stream");
        return;
      } catch (error) {
        console.error("[retry-missing-completed-result]", {
          projectId: project.id,
          resultStorageKey: project.resultStorageKey,
          error,
        });
      }
    }
  }

  const retry = await db
    .$transaction(async (tx) => {
      const reservation = await reserveGenerationCreditInTransaction(tx, { userId: session.userId, projectId: project.id });
      if (!reservation.ok) {
        return reservation;
      }

      const updated = await tx.project.updateMany({
        where: { id: project.id, userId: session.userId, status: project.status, archivedAt: null },
        data: { status: "QUEUED", errorMessage: null, resultImageUrl: null, resultStorageKey: null },
      });

      if (updated.count === 0) {
        throw new RetryProjectClaimLostError();
      }

      return { ok: true as const };
    })
    .catch((error) => {
      if (error instanceof RetryProjectClaimLostError) {
        return { ok: false as const, error: "CLAIM_LOST" };
      }

      throw error;
    });

  if (!retry.ok) {
    if (retry.error !== "CLAIM_LOST") {
      redirect(`/billing?error=${encodeURIComponent(retry.error)}`);
    }
    return;
  }

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/projects");
  after(() => processImageProject(project.id));
  redirect(`/projects/${project.id}`);
}
