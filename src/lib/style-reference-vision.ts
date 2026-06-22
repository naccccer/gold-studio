import {
  analyzeStyleReferenceImageWithLiara,
  type StyleReferenceVisionMetadata,
  visionModel,
} from "@/lib/ai/vision";
import { getProviderSettings } from "@/lib/ai/provider-settings";
import { db } from "@/lib/db";
import { readStoredUpload } from "@/lib/uploads";
import type { ImageProvider } from "@/lib/ai/provider";

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

export function buildSampleReferencePromptContext(input?: StyleReferencePromptMetadata | null, productImageCount = 1) {
  const metadata = input ? normalizeReferencePromptMetadata(input) : null;
  const safeProductImageCount = Math.max(1, productImageCount);
  const sampleImageNumber = safeProductImageCount + 1;
  const productImageLabel = safeProductImageCount === 1 ? "image 1" : `images 1-${safeProductImageCount}`;
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
    "Strict product-locked sample style mode:",
    `Use ${productImageLabel} as the only product identity source. The product from ${productImageLabel} is locked: preserve its shape, proportions, silhouette, metal color, gemstone count and placement, visible chain or front-facing clasp design when naturally visible, watch face, engravings, material finish, and all visible details.`,
    `Do not morph, redesign, recolor, simplify, re-stone, resize, replace, rotate into an incompatible pose, or reinterpret the user's product to fit image ${sampleImageNumber}.`,
    "Do not expose, invent, duplicate, or relocate hidden backs, rear clasps, closures, posts, undersides, or hardware just to show construction details.",
    `Use image ${sampleImageNumber} only as a loose non-identity visual style reference for lighting, color mood, background/surface language, camera feel, reflections, water/fabric/stone/material atmosphere, and broad composition.`,
    `Image ${sampleImageNumber} is not the target image. Do not copy its product, hand, wrist, fingers, skin, nails, face, body, clothing, pose, or any worn/held lifestyle subject into the result.`,
    "For this product-only sample style, output a standalone premium product image. Human elements from either the source or sample are temporary context only and must be removed unless the selected style is explicitly a human model style.",
    `If the sample is a worn or held product photo, extract only the visual mood and environment. Re-stage the user's product from ${productImageLabel} as a standalone product in a compatible scene, not on the sample hand/body.`,
    `If there is any conflict between preserving product identity from ${productImageLabel} and matching image ${sampleImageNumber}, preserve product identity and reduce sample matching.`,
    "The result should look like the user's exact product was newly photographed with the sample's broad art direction, not like the sample product or sample pose was edited.",
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

function metadataToUpdate(metadata: StyleReferenceVisionMetadata, provider?: ImageProvider) {
  return {
    visionSceneDescription: metadata.sceneDescription,
    visionCameraAngle: metadata.cameraAngle,
    visionLighting: metadata.lighting,
    visionBackground: metadata.background,
    visionSubjectDescription: metadata.subjectDescription,
    visionConfidence: metadata.confidence,
    visionModel: visionModel(provider),
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

  const providerSettings = await getProviderSettings();
  const visionProvider = providerSettings.imageProvider;
  const usedVisionModel = visionModel(visionProvider);

  try {
    const source = await readStoredUpload(asset.storageKey, asset.mimeType);
    const metadata = await analyzeStyleReferenceImageWithLiara({
      sourceBuffer: source.buffer,
      mimeType: source.mimeType,
      provider: visionProvider,
    });

    return await db.styleReferenceAsset.update({
      where: { id: asset.id },
      data: metadataToUpdate(metadata, visionProvider),
    });
  } catch (error) {
    await db.styleReferenceAsset.updateMany({
      where: { id: asset.id },
      data: {
        visionModel: usedVisionModel,
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
      visionError: true,
      visionModel: true,
    },
  });

  if (!asset) {
    return asset;
  }

  if (asset.visionAnalyzedAt && !asset.visionError) {
    return asset;
  }

  const providerSettings = await getProviderSettings();
  if (asset.visionAnalyzedAt && asset.visionError && asset.visionModel === visionModel(providerSettings.imageProvider)) {
    return asset;
  }

  return analyzeAndStoreStyleReferenceVision(asset.id);
}
