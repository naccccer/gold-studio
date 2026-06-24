import { generateStyledImageWithAvalai, generateTextImageWithAvalai } from "@/lib/ai/avalai";
import { generateStyledImageWithLiara, generateTextImageWithLiara } from "@/lib/ai/liara";
import { imageProviderLabel, type GeneratedImageResult } from "@/lib/ai/provider";
import {
  getImageProviderAttemptOrder,
  getProviderSettings,
  getRoutedImageProviderAttemptOrder,
  resolveModelRoutingDecision,
  type ProviderModelAttempt,
} from "@/lib/ai/provider-settings";
import { isSampleReferenceStyleId } from "@/lib/ai/style-policy";
import { captureGenerationCreditReservation, logProviderEvent, releaseGenerationCreditReservation } from "@/lib/billing";
import { db } from "@/lib/db";
import { buildSampleReferenceVisionPromptContext, ensureStyleReferenceVision } from "@/lib/style-reference-vision";
import { readStoredUpload, saveGeneratedImage } from "@/lib/uploads";
import { DEFAULT_VERTICAL_ID, normalizeVerticalId, type VerticalId } from "@/lib/verticals";

const DEFAULT_STALE_PROCESSING_MS = 90 * 60 * 1000;
const DEFAULT_WORKER_LIMIT = 1;
const MAX_WORKER_LIMIT = 3;

function collectErrorText(error: unknown, depth = 0): string {
  if (depth > 3 || error === null || error === undefined) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error !== "object") {
    return "";
  }

  const maybeError = error as {
    message?: unknown;
    code?: unknown;
    cause?: unknown;
    error?: { message?: unknown; code?: unknown };
  };

  return [
    typeof maybeError.message === "string" ? maybeError.message : "",
    typeof maybeError.code === "string" ? maybeError.code : "",
    typeof maybeError.error?.message === "string" ? maybeError.error.message : "",
    typeof maybeError.error?.code === "string" ? maybeError.error.code : "",
    collectErrorText(maybeError.cause, depth + 1),
  ].join(" ");
}

function technicalErrorMessage(error: unknown, fallback: string) {
  const collected = collectErrorText(error).trim();

  if (error instanceof Error && error.message.trim()) {
    const details = [error.message, collected].filter(Boolean);
    return Array.from(new Set(details)).join(" | ");
  }

  return collected || fallback;
}

function userErrorMessage(error: unknown, fallback: string) {
  const detail = collectErrorText(error).toLowerCase();

  if (detail.includes("avalai_api_key")) {
    return "تنظیمات سرویس تولید تصویر کامل نیست. کلید AVALAI_API_KEY در محیط اجرا تنظیم نشده است.";
  }

  if (detail.includes("liara_api_key")) {
    return "تنظیمات سرویس تولید تصویر کامل نیست. کلید LIARA_API_KEY در محیط اجرا تنظیم نشده است.";
  }

  if (detail.includes("insufficient balance") || detail.includes("status 402")) {
    return "اعتبار پنل provider برای ساخت این تصویر کافی نیست. شارژ سرویس تولید تصویر را بررسی کنید.";
  }

  if (detail.includes("temporary network error")) {
    return "ارتباط سرور با provider بعد از چند تلاش کامل نشد. اگر روی لوکال هستید، اتصال اینترنت یا پراکسی سرویس تولید تصویر را بررسی کنید و دوباره تلاش کنید.";
  }

  if (detail.includes("timeout") || detail.includes("timed out")) {
    return "زمان پاسخ‌گویی سرویس تولید تصویر بیش از حد طولانی شد. چند دقیقه بعد دوباره تلاش کنید.";
  }

  if (detail.includes("socket hang up") || detail.includes("provider_error") || detail.includes("status 400")) {
    if (detail.includes("image") || detail.includes("reference") || detail.includes("multipart")) {
      return "ارسال هم‌زمان عکس محصول و عکس نمونه برای provider کامل نشد. پروژه ناموفق شد و جزئیات خطای provider در پنل ادمین ثبت شده است.";
    }

    return "درخواست تولید تصویر به provider رسید، اما provider آن را کامل نکرد. مدل، سایز خروجی، اعتبار سرویس و دسترسی شبکه را بررسی کنید.";
  }

  if (detail.includes("did not return an image")) {
    return "سرویس تولید تصویر پاسخ داد، اما فایل تصویر خروجی برنگرداند. دوباره تلاش کنید یا مدل provider را بررسی کنید.";
  }

  if (detail.includes("not a valid png") || detail.includes("تصویر معتبر")) {
    return "فایل خروجی سرویس تولید تصویر معتبر نبود و ذخیره نشد.";
  }

  return fallback;
}

function attemptLabel(attempt: ProviderModelAttempt) {
  return `${attempt.provider}/${attempt.model}`;
}

async function touchProcessingProject(projectId: string) {
  await db.project.updateMany({
    where: { id: projectId, status: "PROCESSING" },
    data: { errorMessage: null },
  });
}

function allModelsFailedError(errors: Array<{ attempt: ProviderModelAttempt; error: unknown }>) {
  const details = errors
    .map(({ attempt, error }) => `${attemptLabel(attempt)}: ${technicalErrorMessage(error, "generation failed")}`)
    .join(" || ");

  return new Error(`All configured image models failed.${details ? ` ${details}` : ""}`);
}

async function generateImageWithModelFallback({
  projectId,
  styleId,
  sourceBuffer,
  mimeType,
  supportingImages,
  referenceBuffer,
  referenceMimeType,
  stylePrompt,
  outputPreset,
  referenceUsed,
  vertical,
}: {
  projectId: string;
  styleId: string;
  sourceBuffer: Buffer;
  mimeType: string;
  supportingImages?: Array<{ buffer: Buffer; mimeType: string }> | null;
  referenceBuffer?: Buffer | null;
  referenceMimeType?: string | null;
  stylePrompt: string;
  outputPreset?: string | null;
  referenceUsed: boolean;
  vertical: VerticalId;
}): Promise<GeneratedImageResult> {
  const errors: Array<{ attempt: ProviderModelAttempt; error: unknown }> = [];
  const providerSettings = await getProviderSettings();
  const routingContext = {
    styleId,
    referenceUsed,
    supportingImageCount: supportingImages?.length ?? 0,
    operation: "image.edit",
  };
  const routingDecision = resolveModelRoutingDecision(routingContext);
  const routingDetail = `routing=${routingDecision.routing}; routingReason=${routingDecision.reason}`;
  const attempts = getRoutedImageProviderAttemptOrder(providerSettings, routingContext);

  for (const [index, attempt] of attempts.entries()) {
    try {
      await touchProcessingProject(projectId);
      const providerLabel = imageProviderLabel(attempt.provider);
      const generate = attempt.provider === "avalai" ? generateStyledImageWithAvalai : generateStyledImageWithLiara;
      const generatedImage = await generate({
        sourceBuffer,
        mimeType,
        supportingImages,
        referenceBuffer,
        referenceMimeType,
        stylePrompt,
        outputPreset,
        model: attempt.model,
        vertical,
      });
      await logProviderEvent({
        projectId,
        provider: attempt.provider,
        operation: "image.edit",
        status: "SUCCESS",
        model: generatedImage.model,
        retryCount: index,
        statusDetail: `provider=${providerLabel}; outputPreset=${outputPreset}; supportingImages=${supportingImages?.length ?? 0}; reference=${
          referenceUsed ? "yes" : "no"
        }; ${routingDetail}; fallbackAttempt=${index + 1}/${attempts.length}`,
      });
      return generatedImage;
    } catch (error) {
      const providerLabel = imageProviderLabel(attempt.provider);
      errors.push({ attempt, error });
      await logProviderEvent({
        projectId,
        provider: attempt.provider,
        operation: "image.edit",
        status: "FAILED",
        model: attempt.model,
        retryCount: index,
        statusDetail: `provider=${providerLabel}; supportingImages=${supportingImages?.length ?? 0}; ${routingDetail}; fallbackAttempt=${
          index + 1
        }/${attempts.length}; next=${
          index < attempts.length - 1 ? attemptLabel(attempts[index + 1]) : "none"
        }`,
        errorMessage: technicalErrorMessage(error, "خطا در تولید تصویر رخ داد."),
      });
    }
  }

  throw allModelsFailedError(errors);
}

async function generateTextImageWithModelFallback({
  projectId,
  prompt,
  stylePrompt,
  outputPreset,
  vertical = DEFAULT_VERTICAL_ID,
}: {
  projectId: string;
  prompt: string;
  stylePrompt: string;
  outputPreset: string;
  vertical?: VerticalId;
}): Promise<GeneratedImageResult> {
  const errors: Array<{ attempt: ProviderModelAttempt; error: unknown }> = [];
  const providerSettings = await getProviderSettings();
  const attempts = getImageProviderAttemptOrder(providerSettings);

  for (const [index, attempt] of attempts.entries()) {
    try {
      await touchProcessingProject(projectId);
      const providerLabel = imageProviderLabel(attempt.provider);
      const generate = attempt.provider === "avalai" ? generateTextImageWithAvalai : generateTextImageWithLiara;
      const generatedImage = await generate({
        prompt,
        stylePrompt,
        outputPreset,
        model: attempt.model,
        vertical,
      });
      await logProviderEvent({
        projectId,
        provider: attempt.provider,
        operation: "image.generate",
        status: "SUCCESS",
        model: generatedImage.model,
        retryCount: index,
        statusDetail: `provider=${providerLabel}; fallbackAttempt=${index + 1}/${attempts.length}`,
      });
      return generatedImage;
    } catch (error) {
      const providerLabel = imageProviderLabel(attempt.provider);
      errors.push({ attempt, error });
      await logProviderEvent({
        projectId,
        provider: attempt.provider,
        operation: "image.generate",
        status: "FAILED",
        model: attempt.model,
        retryCount: index,
        statusDetail: `provider=${providerLabel}; fallbackAttempt=${index + 1}/${attempts.length}; next=${
          index < attempts.length - 1 ? attemptLabel(attempts[index + 1]) : "none"
        }`,
        errorMessage: technicalErrorMessage(error, "خطا در تست متن به تصویر رخ داد."),
      });
    }
  }

  throw allModelsFailedError(errors);
}

async function claimQueuedProject(projectId: string) {
  const claimed = await db.project.updateMany({
    where: { id: projectId, status: "QUEUED" },
    data: { status: "PROCESSING", errorMessage: null },
  });

  return claimed.count > 0;
}

function normalizeWorkerLimit(limit?: number | null) {
  if (!Number.isFinite(limit ?? NaN)) {
    return DEFAULT_WORKER_LIMIT;
  }

  return Math.min(MAX_WORKER_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_WORKER_LIMIT)));
}

function normalizeStaleProcessingMs(staleProcessingMs?: number | null) {
  if (!Number.isFinite(staleProcessingMs ?? NaN) || (staleProcessingMs ?? 0) < 5 * 60 * 1000) {
    return DEFAULT_STALE_PROCESSING_MS;
  }

  return staleProcessingMs ?? DEFAULT_STALE_PROCESSING_MS;
}

export async function recoverStaleGenerationJobs({
  staleProcessingMs,
}: {
  staleProcessingMs?: number | null;
} = {}) {
  const cutoff = new Date(Date.now() - normalizeStaleProcessingMs(staleProcessingMs));
  const [projects, batches] = await Promise.all([
    db.project.updateMany({
      where: {
        status: "PROCESSING",
        updatedAt: { lt: cutoff },
        resultImageUrl: null,
      },
      data: {
        status: "QUEUED",
        errorMessage: null,
      },
    }),
    db.generationBatch.updateMany({
      where: {
        status: "PROCESSING",
        updatedAt: { lt: cutoff },
      },
      data: { status: "QUEUED" },
    }),
  ]);

  return {
    recoveredProjects: projects.count,
    recoveredBatches: batches.count,
  };
}

async function nextQueuedDurableProject() {
  return db.project.findFirst({
    where: {
      status: "QUEUED",
      archivedAt: null,
      sourceAssetId: { not: null },
      OR: [
        { variantParentId: { not: null } },
        { creditReservations: { some: { status: "RESERVED" } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
}

export async function processQueuedGenerationJobs({
  limit,
  staleProcessingMs,
}: {
  limit?: number | null;
  staleProcessingMs?: number | null;
} = {}) {
  const recovery = await recoverStaleGenerationJobs({ staleProcessingMs });
  const safeLimit = normalizeWorkerLimit(limit);
  let processedProjects = 0;

  for (let index = 0; index < safeLimit; index += 1) {
    const project = await nextQueuedDurableProject();
    if (!project) {
      break;
    }

    const processed = await processImageProject(project.id);
    if (processed) {
      processedProjects += 1;
    }
  }

  return {
    ...recovery,
    processedProjects,
  };
}

async function resolveBatchStatus(batchId: string) {
  const [completedCount, activeCount, failedCount] = await Promise.all([
    db.generationBatchItem.count({
      where: { batchId, project: { status: "COMPLETED" } },
    }),
    db.generationBatchItem.count({
      where: { batchId, project: { status: { in: ["QUEUED", "PROCESSING"] } } },
    }),
    db.generationBatchItem.count({
      where: { batchId, project: { status: "FAILED" } },
    }),
  ]);

  return activeCount > 0
    ? "PROCESSING"
    : completedCount > 0 && failedCount === 0
      ? "COMPLETED"
      : completedCount === 0 && failedCount > 0
        ? "FAILED"
        : completedCount > 0 && failedCount > 0
          ? "PROCESSING"
          : "FAILED";
}

async function refreshGenerationBatchesForProject(projectId: string) {
  const batchItems = await db.generationBatchItem.findMany({
    where: { projectId },
    select: { batchId: true },
  });

  for (const item of batchItems) {
    await db.generationBatch.update({
      where: { id: item.batchId },
      data: { status: await resolveBatchStatus(item.batchId) },
    });
  }
}

async function enrichPromptWithReferenceVision(project: {
  id: string;
  styleId: string;
  prompt: string;
  referenceAssetId: string | null;
}) {
  if (!isSampleReferenceStyleId(project.styleId) || !project.referenceAssetId) {
    return project.prompt;
  }

  const metadata = await ensureStyleReferenceVision(project.referenceAssetId);
  const referenceVisionContext = buildSampleReferenceVisionPromptContext(metadata);
  if (!referenceVisionContext || project.prompt.includes("Reference scene analysis:")) {
    return project.prompt;
  }

  const enrichedPrompt = `${project.prompt}\n${referenceVisionContext}`;
  await db.project.update({
    where: { id: project.id },
    data: { prompt: enrichedPrompt },
  });

  return enrichedPrompt;
}

export async function processImageProject(projectId: string) {
  const claimed = await claimQueuedProject(projectId);
  if (!claimed) {
    return false;
  }

  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        sourceAsset: {
          select: {
            storageKey: true,
            mimeType: true,
          },
        },
        referenceAsset: {
          select: {
            storageKey: true,
            mimeType: true,
          },
        },
        supportingAssets: {
          orderBy: { position: "asc" },
          select: {
            asset: {
              select: {
                storageKey: true,
                mimeType: true,
              },
            },
          },
        },
      },
    });

    if (!project?.sourceAsset) {
      throw new Error("تصویر ورودی پروژه پیدا نشد.");
    }

    if (isSampleReferenceStyleId(project.styleId) && !project.referenceAsset) {
      throw new Error("برای سبک عکس نمونه، فایل نمونه پروژه پیدا نشد.");
    }

    const source = await readStoredUpload(project.sourceAsset.storageKey, project.sourceAsset.mimeType);
    const supportingImages = await Promise.all(
      project.supportingAssets.map((item) => readStoredUpload(item.asset.storageKey, item.asset.mimeType)),
    );
    const reference = project.referenceAsset
      ? await readStoredUpload(project.referenceAsset.storageKey, project.referenceAsset.mimeType)
      : null;
    const stylePrompt = await enrichPromptWithReferenceVision({
      id: project.id,
      styleId: project.styleId,
      prompt: project.prompt,
      referenceAssetId: project.referenceAssetId,
    });
    const generatedImage = await generateImageWithModelFallback({
      projectId,
      styleId: project.styleId,
      sourceBuffer: source.buffer,
      mimeType: source.mimeType,
      supportingImages,
      referenceBuffer: reference?.buffer ?? null,
      referenceMimeType: reference?.mimeType ?? null,
      stylePrompt,
      outputPreset: project.outputPreset,
      referenceUsed: Boolean(project.referenceAsset),
      vertical: normalizeVerticalId(project.vertical),
    });
    const result = await saveGeneratedImage(generatedImage.imageBuffer, generatedImage.mimeType);

    await db.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED", resultImageUrl: result.publicUrl, resultStorageKey: result.storageKey, errorMessage: null },
    });
    if (project.variantParentId) {
      await db.project.updateMany({
        where: { id: project.variantParentId, freeVariantProjectId: projectId },
        data: { freeVariantUsedAt: new Date(), freeVariantProjectId: null },
      });
    }
    await captureGenerationCreditReservation({ projectId });
    await refreshGenerationBatchesForProject(projectId);
    return true;
  } catch (error) {
    await releaseGenerationCreditReservation({ projectId });
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "FAILED",
        errorMessage: userErrorMessage(error, "تولید تصویر کامل نشد. جزئیات بیشتر در بخش ادمین و رویدادهای provider ثبت شد."),
      },
    });
    const failedProject = await db.project.findUnique({
      where: { id: projectId },
      select: { variantParentId: true },
    });
    if (failedProject?.variantParentId) {
      await db.project.updateMany({
        where: { id: failedProject.variantParentId, freeVariantProjectId: projectId },
        data: { freeVariantProjectId: null },
      });
    }
    await refreshGenerationBatchesForProject(projectId);
    return true;
  }
}

export async function processTextProject({
  projectId,
  textPrompt,
  stylePrompt,
  vertical = DEFAULT_VERTICAL_ID,
}: {
  projectId: string;
  textPrompt: string;
  stylePrompt: string;
  vertical?: VerticalId;
}) {
  const claimed = await claimQueuedProject(projectId);
  if (!claimed) {
    return false;
  }

  try {
    const generatedImage = await generateTextImageWithModelFallback({
      projectId,
      prompt: textPrompt,
      stylePrompt,
      outputPreset: "post",
      vertical,
    });
    const result = await saveGeneratedImage(generatedImage.imageBuffer, generatedImage.mimeType);

    await db.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED", resultImageUrl: result.publicUrl, resultStorageKey: result.storageKey, errorMessage: null },
    });
    await captureGenerationCreditReservation({ projectId });
    await refreshGenerationBatchesForProject(projectId);
    return true;
  } catch (error) {
    await releaseGenerationCreditReservation({ projectId });
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "FAILED",
        errorMessage: userErrorMessage(error, "تست متن به تصویر کامل نشد. جزئیات بیشتر در بخش ادمین و رویدادهای provider ثبت شد."),
      },
    });
    return true;
  }
}

export async function processGenerationBatch(batchId: string) {
  const claimed = await db.generationBatch.updateMany({
    where: { id: batchId, status: "QUEUED" },
    data: { status: "PROCESSING" },
  });

  if (claimed.count === 0) {
    return;
  }

  const batch = await db.generationBatch.findUnique({
    where: { id: batchId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          projectId: true,
        },
      },
    },
  });

  if (!batch) {
    return;
  }

  for (const item of batch.items) {
    if (item.projectId) {
      await processImageProject(item.projectId);
    }
  }

  await db.generationBatch.update({
    where: { id: batchId },
    data: { status: await resolveBatchStatus(batchId) },
  });
}
