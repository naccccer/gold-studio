import { analyzeProductImageWithLiara, liaraVisionModel, serializeQualityIssues } from "@/lib/ai/vision";
import { db } from "@/lib/db";
import { readStoredUpload } from "@/lib/uploads";

function errorText(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 1000) : "Vision analysis failed.";
}

function isMissingRecordError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2025"
  );
}

export async function analyzeAndStoreProductAssetVision(assetId: string) {
  const asset = await db.productAsset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      productType: true,
    },
  });

  if (!asset) {
    return null;
  }

  try {
    const source = await readStoredUpload(asset.storageKey, asset.mimeType);
    const metadata = await analyzeProductImageWithLiara({
      sourceBuffer: source.buffer,
      mimeType: source.mimeType,
    });

    try {
      return await db.productAsset.update({
        where: { id: asset.id },
        data: {
          productType: asset.productType || metadata.productType,
          visionShortTitle: metadata.shortTitle,
          visionDescription: metadata.internalDescription,
          visionAngle: metadata.detectedAngle,
          visionQualityIssues: serializeQualityIssues(metadata.qualityIssues),
          visionConfidence: metadata.confidence,
          visionModel: liaraVisionModel(),
          visionAnalyzedAt: new Date(),
          visionError: null,
        },
      });
    } catch (error) {
      if (isMissingRecordError(error)) {
        return null;
      }

      throw error;
    }
  } catch (error) {
    await db.productAsset.updateMany({
      where: { id: asset.id },
      data: {
        visionModel: liaraVisionModel(),
        visionAnalyzedAt: new Date(),
        visionError: errorText(error),
      },
    });

    return null;
  }
}

export async function ensureProductAssetVision(assetId: string) {
  const asset = await db.productAsset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      productType: true,
      visionShortTitle: true,
      visionDescription: true,
      visionConfidence: true,
      visionAnalyzedAt: true,
    },
  });

  if (!asset || asset.visionAnalyzedAt) {
    return asset;
  }

  return analyzeAndStoreProductAssetVision(asset.id);
}

export function pickVisionTitle(input: {
  userTitle?: string | null;
  visionShortTitle?: string | null;
  fallbackTitle?: string | null;
}) {
  return input.userTitle?.trim() || input.visionShortTitle?.trim() || input.fallbackTitle?.trim() || null;
}
