import { generateStyledImageWithLiara, generateTextImageWithLiara } from "@/lib/ai/liara";
import { db } from "@/lib/db";
import { readStoredUpload, saveGeneratedImage } from "@/lib/uploads";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function claimQueuedProject(projectId: string) {
  const claimed = await db.project.updateMany({
    where: { id: projectId, status: "QUEUED" },
    data: { status: "PROCESSING", errorMessage: null },
  });

  return claimed.count > 0;
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
      },
    });

    if (!project?.sourceAsset) {
      throw new Error("تصویر ورودی پروژه پیدا نشد.");
    }

    const source = await readStoredUpload(project.sourceAsset.storageKey, project.sourceAsset.mimeType);
    const generatedImage = await generateStyledImageWithLiara({
      sourceBuffer: source.buffer,
      mimeType: source.mimeType,
      stylePrompt: project.prompt,
    });
    const result = await saveGeneratedImage(generatedImage.imageBuffer);

    await db.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED", resultImageUrl: result.publicUrl, resultStorageKey: result.storageKey, errorMessage: null },
    });
  } catch (error) {
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "FAILED",
        errorMessage: errorMessage(error, "خطا در تولید تصویر رخ داد."),
      },
    });
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
    const generatedImage = await generateTextImageWithLiara({
      prompt: textPrompt,
      stylePrompt,
    });
    const result = await saveGeneratedImage(generatedImage.imageBuffer);

    await db.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED", resultImageUrl: result.publicUrl, resultStorageKey: result.storageKey, errorMessage: null },
    });
  } catch (error) {
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "FAILED",
        errorMessage: errorMessage(error, "خطا در تست متن به تصویر رخ داد."),
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

  await db.generationBatch.update({
    where: { id: batchId },
    data: {
      status: activeCount > 0 ? "PROCESSING" : completedCount > 0 ? "COMPLETED" : failedCount > 0 ? "FAILED" : "FAILED",
    },
  });
}
