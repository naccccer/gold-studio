import { generateStyledImageWithLiara, generateTextImageWithLiara, type LiaraImageResult } from "@/lib/ai/liara";
import { getImageModelAttemptOrder, getProviderSettings } from "@/lib/ai/provider-settings";
import { captureGenerationCreditReservation, logProviderEvent, releaseGenerationCreditReservation } from "@/lib/billing";
import { db } from "@/lib/db";
import { buildSampleReferenceVisionPromptContext, ensureStyleReferenceVision } from "@/lib/style-reference-vision";
import { readStoredUpload, saveGeneratedImage } from "@/lib/uploads";

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

  if (detail.includes("liara_api_key")) {
    return "تنظیمات سرویس تولید تصویر کامل نیست. کلید LIARA_API_KEY در محیط اجرا تنظیم نشده است.";
  }

  if (detail.includes("insufficient balance") || detail.includes("status 402")) {
    return "اعتبار پنل Liara برای ساخت این تصویر کافی نیست. شارژ سرویس تولید تصویر را بررسی کنید.";
  }

  if (detail.includes("temporary network error")) {
    return "ارتباط سرور با Liara بعد از چند تلاش کامل نشد. اگر روی لوکال هستید، اتصال اینترنت یا پراکسی Liara را بررسی کنید و دوباره تلاش کنید.";
  }

  if (detail.includes("timeout") || detail.includes("timed out")) {
    return "زمان پاسخ‌گویی سرویس تولید تصویر بیش از حد طولانی شد. چند دقیقه بعد دوباره تلاش کنید.";
  }

  if (detail.includes("socket hang up") || detail.includes("provider_error") || detail.includes("status 400")) {
    if (detail.includes("image") || detail.includes("reference") || detail.includes("multipart")) {
      return "ارسال هم‌زمان عکس محصول و عکس نمونه برای provider کامل نشد. پروژه ناموفق شد و جزئیات خطای provider در پنل ادمین ثبت شده است.";
    }

    return "درخواست تولید تصویر به Liara رسید، اما provider آن را کامل نکرد. مدل، سایز خروجی، اعتبار Liara و دسترسی شبکه را بررسی کنید.";
  }

  if (detail.includes("did not return an image")) {
    return "سرویس تولید تصویر پاسخ داد، اما فایل تصویر خروجی برنگرداند. دوباره تلاش کنید یا مدل Liara را بررسی کنید.";
  }

  if (detail.includes("not a valid png") || detail.includes("تصویر معتبر")) {
    return "فایل خروجی سرویس تولید تصویر معتبر نبود و ذخیره نشد.";
  }

  return fallback;
}

async function modelAttemptOrder() {
  return getImageModelAttemptOrder(await getProviderSettings());
}

function allModelsFailedError(errors: Array<{ model: string; error: unknown }>) {
  const details = errors
    .map(({ model, error }) => `${model}: ${technicalErrorMessage(error, "generation failed")}`)
    .join(" || ");

  return new Error(`All configured image models failed.${details ? ` ${details}` : ""}`);
}

async function generateImageWithModelFallback({
  projectId,
  sourceBuffer,
  mimeType,
  supportingImages,
  referenceBuffer,
  referenceMimeType,
  stylePrompt,
  outputPreset,
  referenceUsed,
}: {
  projectId: string;
  sourceBuffer: Buffer;
  mimeType: string;
  supportingImages?: Array<{ buffer: Buffer; mimeType: string }> | null;
  referenceBuffer?: Buffer | null;
  referenceMimeType?: string | null;
  stylePrompt: string;
  outputPreset?: string | null;
  referenceUsed: boolean;
}): Promise<LiaraImageResult> {
  const errors: Array<{ model: string; error: unknown }> = [];
  const models = await modelAttemptOrder();

  for (const [index, model] of models.entries()) {
    try {
      const generatedImage = await generateStyledImageWithLiara({
        sourceBuffer,
        mimeType,
        supportingImages,
        referenceBuffer,
        referenceMimeType,
        stylePrompt,
        outputPreset,
        model,
      });
      await logProviderEvent({
        projectId,
        operation: "image.edit",
        status: "SUCCESS",
        model: generatedImage.model,
        retryCount: index,
        statusDetail: `outputPreset=${outputPreset}; supportingImages=${supportingImages?.length ?? 0}; reference=${referenceUsed ? "yes" : "no"}; fallbackAttempt=${index + 1}/${models.length}`,
      });
      return generatedImage;
    } catch (error) {
      errors.push({ model, error });
      await logProviderEvent({
        projectId,
        operation: "image.edit",
        status: "FAILED",
        model,
        retryCount: index,
        statusDetail: `supportingImages=${supportingImages?.length ?? 0}; fallbackAttempt=${index + 1}/${models.length}; next=${index < models.length - 1 ? models[index + 1] : "none"}`,
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
}: {
  projectId: string;
  prompt: string;
  stylePrompt: string;
  outputPreset: string;
}): Promise<LiaraImageResult> {
  const errors: Array<{ model: string; error: unknown }> = [];
  const models = await modelAttemptOrder();

  for (const [index, model] of models.entries()) {
    try {
      const generatedImage = await generateTextImageWithLiara({
        prompt,
        stylePrompt,
        outputPreset,
        model,
      });
      await logProviderEvent({
        projectId,
        operation: "image.generate",
        status: "SUCCESS",
        model: generatedImage.model,
        retryCount: index,
        statusDetail: `fallbackAttempt=${index + 1}/${models.length}`,
      });
      return generatedImage;
    } catch (error) {
      errors.push({ model, error });
      await logProviderEvent({
        projectId,
        operation: "image.generate",
        status: "FAILED",
        model,
        retryCount: index,
        statusDetail: `fallbackAttempt=${index + 1}/${models.length}; next=${index < models.length - 1 ? models[index + 1] : "none"}`,
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
  if (project.styleId !== "style_sample_reference" || !project.referenceAssetId) {
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
    return;
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

    if (project.styleId === "style_sample_reference" && !project.referenceAsset) {
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
      sourceBuffer: source.buffer,
      mimeType: source.mimeType,
      supportingImages,
      referenceBuffer: reference?.buffer ?? null,
      referenceMimeType: reference?.mimeType ?? null,
      stylePrompt,
      outputPreset: project.outputPreset,
      referenceUsed: Boolean(project.referenceAsset),
    });
    const result = await saveGeneratedImage(generatedImage.imageBuffer, generatedImage.mimeType);

    await db.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED", resultImageUrl: result.publicUrl, resultStorageKey: result.storageKey, errorMessage: null },
    });
    if (project.variantParentId) {
      await db.project.updateMany({
        where: { id: project.variantParentId, freeVariantProjectId: projectId, freeVariantUsedAt: null },
        data: { freeVariantUsedAt: new Date() },
      });
    }
    await captureGenerationCreditReservation({ projectId });
    await refreshGenerationBatchesForProject(projectId);
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
        where: { id: failedProject.variantParentId, freeVariantProjectId: projectId, freeVariantUsedAt: null },
        data: { freeVariantProjectId: null },
      });
    }
    await refreshGenerationBatchesForProject(projectId);
  }
}

export async function processTextProject({
  projectId,
  textPrompt,
  stylePrompt,
}: {
  projectId: string;
  textPrompt: string;
  stylePrompt: string;
}) {
  const claimed = await claimQueuedProject(projectId);
  if (!claimed) {
    return;
  }

  try {
    const generatedImage = await generateTextImageWithModelFallback({
      projectId,
      prompt: textPrompt,
      stylePrompt,
      outputPreset: "post",
    });
    const result = await saveGeneratedImage(generatedImage.imageBuffer, generatedImage.mimeType);

    await db.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED", resultImageUrl: result.publicUrl, resultStorageKey: result.storageKey, errorMessage: null },
    });
    await captureGenerationCreditReservation({ projectId });
    await refreshGenerationBatchesForProject(projectId);
  } catch (error) {
    await releaseGenerationCreditReservation({ projectId });
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "FAILED",
        errorMessage: userErrorMessage(error, "تست متن به تصویر کامل نشد. جزئیات بیشتر در بخش ادمین و رویدادهای provider ثبت شد."),
      },
    });
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
