import {
  analyzeStyleReferenceImageWithLiara,
  liaraVisionModel,
  type StyleReferenceVisionMetadata,
} from "@/lib/ai/vision";
import { db } from "@/lib/db";
import { readStoredUpload } from "@/lib/uploads";

const MIN_REFERENCE_CONFIDENCE = 0.35;

type StyleReferencePromptMetadata = {
  visionSceneDescription?: string | null;
  visionCameraAngle?: string | null;
  visionLighting?: string | null;
  visionBackground?: string | null;
  visionSubjectDescription?: string | null;
  visionConfidence?: number | null;
};

function errorText(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 1000) : "Reference vision analysis failed.";
}

function cleanText(value?: string | null) {
  const text = value?.replace(/\s+/g, " ").trim();
  return text || null;
}

export function normalizeReferencePromptMetadata(input: StyleReferencePromptMetadata): Required<StyleReferencePromptMetadata> {
  return {
    visionSceneDescription: cleanText(input.visionSceneDescription),
    visionCameraAngle: cleanText(input.visionCameraAngle),
    visionLighting: cleanText(input.visionLighting),
    visionBackground: cleanText(input.visionBackground),
    visionSubjectDescription: cleanText(input.visionSubjectDescription),
    visionConfidence: typeof input.visionConfidence === "number" ? Math.min(1, Math.max(0, input.visionConfidence)) : null,
  };
}

export function buildSampleReferencePromptContext(input?: StyleReferencePromptMetadata | null) {
  const metadata = input ? normalizeReferencePromptMetadata(input) : null;
  const hasReliableMetadata =
    metadata &&
    (metadata.visionConfidence ?? 0) >= MIN_REFERENCE_CONFIDENCE &&
    Boolean(
      metadata.visionSceneDescription ||
        metadata.visionCameraAngle ||
        metadata.visionLighting ||
        metadata.visionBackground ||
        metadata.visionSubjectDescription,
    );

  const promptParts = [
    "Strict sample-photo replacement mode:",
    "Use image 1 as the absolute product identity source. Preserve the user's product shape, proportions, silhouette, metal color, gemstone count and placement, chain or clasp design, watch face, engravings, material finish, and all visible details.",
    "Use image 2 only as the scene/style template. Preserve its setup, camera angle, perspective, product placement, framing, surface, background, props, lighting direction, shadow behavior, reflections, color palette, and mood as closely as possible.",
    "Remove, ignore, and do not copy the sample product identity from image 2. Place the user's product from image 1 exactly where the sample product/subject sits in image 2, adapted only as needed for realistic scale, contact shadows, perspective, and material reflections.",
    "The result should look as if the user's product was physically photographed in the sample environment with the same lighting and camera setup.",
    "If there is conflict between product identity and sample scene, product identity from image 1 wins; scene, light, angle, and composition from image 2 should still be followed as closely as possible.",
  ];

  if (hasReliableMetadata && metadata) {
    promptParts.push(buildSampleReferenceVisionPromptContext(metadata));
  }

  return promptParts.join("\n");
}

export function buildSampleReferenceVisionPromptContext(input?: StyleReferencePromptMetadata | null) {
  const metadata = input ? normalizeReferencePromptMetadata(input) : null;
  if (!metadata || (metadata.visionConfidence ?? 0) < MIN_REFERENCE_CONFIDENCE) {
    return "";
  }

  return [
    "Reference scene analysis:",
    metadata.visionSceneDescription ? `- Setup/composition: ${metadata.visionSceneDescription}` : null,
    metadata.visionCameraAngle ? `- Camera angle/perspective: ${metadata.visionCameraAngle}` : null,
    metadata.visionLighting ? `- Lighting: ${metadata.visionLighting}` : null,
    metadata.visionBackground ? `- Background/surface/props: ${metadata.visionBackground}` : null,
    metadata.visionSubjectDescription ? `- Sample subject to replace: ${metadata.visionSubjectDescription}` : null,
  ].filter(Boolean).join("\n");
}

function metadataToUpdate(metadata: StyleReferenceVisionMetadata) {
  return {
    visionSceneDescription: metadata.sceneDescription,
    visionCameraAngle: metadata.cameraAngle,
    visionLighting: metadata.lighting,
    visionBackground: metadata.background,
    visionSubjectDescription: metadata.subjectDescription,
    visionConfidence: metadata.confidence,
    visionModel: liaraVisionModel(),
    visionAnalyzedAt: new Date(),
    visionError: null,
  };
}

export async function analyzeAndStoreStyleReferenceVision(referenceAssetId: string) {
  const asset = await db.styleReferenceAsset.findUnique({
    where: { id: referenceAssetId },
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
    },
  });

  if (!asset) {
    return null;
  }

  try {
    const source = await readStoredUpload(asset.storageKey, asset.mimeType);
    const metadata = await analyzeStyleReferenceImageWithLiara({
      sourceBuffer: source.buffer,
      mimeType: source.mimeType,
    });

    return await db.styleReferenceAsset.update({
      where: { id: asset.id },
      data: metadataToUpdate(metadata),
    });
  } catch (error) {
    await db.styleReferenceAsset.updateMany({
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

export async function ensureStyleReferenceVision(referenceAssetId: string) {
  const asset = await db.styleReferenceAsset.findUnique({
    where: { id: referenceAssetId },
    select: {
      id: true,
      visionSceneDescription: true,
      visionCameraAngle: true,
      visionLighting: true,
      visionBackground: true,
      visionSubjectDescription: true,
      visionConfidence: true,
      visionAnalyzedAt: true,
    },
  });

  if (!asset || asset.visionAnalyzedAt) {
    return asset;
  }

  return analyzeAndStoreStyleReferenceVision(asset.id);
}
