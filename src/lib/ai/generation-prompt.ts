import { buildHumanModelProductWearPrompt, buildStyleControlPrompt } from "@/lib/ai/style-controls";
import { buildProductOnlyIsolationPrompt, isHumanWearableStyle } from "@/lib/ai/style-policy";
import { buildVisionPromptContext } from "@/lib/ai/vision";
import { getOutputPresetSpec, normalizeOutputPreset } from "@/lib/output-presets";
import { DEFAULT_PRODUCT_TYPE, normalizeProductType } from "@/lib/product-types";
import { buildSampleReferencePromptContext } from "@/lib/style-reference-vision";

type GenerationPromptStyle = {
  id: string;
  prompt: string;
  controls?: Array<{
    key: string;
    label: string;
    type: "CHOICE" | "RANGE" | "BOOLEAN";
    optionsJson?: string | null;
    defaultValue?: string | null;
    minValue?: number | null;
    maxValue?: number | null;
  }>;
};

type GenerationPromptVision = {
  productType?: string | null;
  visionDescription?: string | null;
  visionConfidence?: number | null;
  visionAngle?: string | null;
};

const SAMPLE_REFERENCE_BASE_PROMPT = [
  "Act as a senior jewelry retoucher doing scene-preserving product replacement.",
  "Use the selected sample image as the target scene, composition, camera angle, lighting, mood, background, surface, props, water/fabric/material atmosphere, and non-product context.",
  "Replace only the product/jewelry/accessory in the sample scene with the user's uploaded product.",
  "Keep the sample scene recognizable, including hand, wrist, body, water, surface, reflections, props, and pose when they are part of the sample composition.",
  "The user's uploaded product is the locked identity source: preserve its exact shape, stones, metal, engravings, proportions, silhouette, and material finish.",
  "Do not copy the sample product identity and do not redesign the uploaded product to fit the sample.",
].join(" ");

function getCompositionInstruction(productType?: string | null, visionAngle?: string | null, options?: { isHumanModelStyle?: boolean }) {
  const isWatch = productType === "ساعت";
  const isWorn = visionAngle === "worn";

  const instructions = [
    "Composition: keep the product clearly readable but not oversized in frame.",
    "Do not default every result to a close-up. Vary the framing toward a slightly pulled-back premium product-photo composition where the full product has clean breathing room on every side.",
    "For normal catalog and studio outputs, the product should often occupy roughly one-quarter to two-fifths of the frame, while tighter close-up framing may be used only when it clearly serves detail, style, or reference direction.",
    "Avoid making most outputs extreme tight crops, edge-to-edge product crops, macro-only crops, or huge centered close-ups.",
  ];

  if (options?.isHumanModelStyle && isWatch && isWorn) {
    instructions.push(
      "For a worn watch, keep a natural amount of wrist and skin visible, with enough surrounding context that the watch is not always an oversized crop while still remaining the obvious hero.",
    );
  }

  return instructions.join("\n");
}

function getStyleCompositionInstruction(styleId: string) {
  if (styleId !== "style_social_media") {
    return "";
  }

  return [
    "Social media composition: do not make the product a huge centered close-up. Keep it premium, readable, and intentionally smaller than a catalog hero shot.",
    "Always reserve text space for this social media style: the product should occupy roughly 18-30% of the frame, placed off-center on one side or lower corner, leaving the opposite side as clean designed negative space for text.",
    "Avoid filling most of the frame with the product, avoid edge-to-edge product crops, and avoid a plain centered packshot composition.",
  ].join("\n");
}

export function getEditorialBackgroundDecorInstruction(styleId: string) {
  if (styleId !== "style_soft_editorial") {
    return "";
  }

  return "Editorial background decor: always include a restrained designed background decor element such as simple geometric volume, matte stone plane, soft fabric plane, plinth, or subtle editorial surface layering. Keep it premium, uncluttered, product-first, and avoid a plain empty catalog background.";
}

function getFineDetailInstruction(productType?: string | null, options?: { isHumanModelStyle?: boolean }) {
  if (productType === "ساعت") {
    return [
      "Fine detail priority: preserve the watch face layout, display structure, bezel markings, button placement, engravings, and case edges.",
      "Keep small functional details crisp and believable; do not blur, simplify, repaint, or replace them with generic shapes.",
    ].join("\n");
  }

  if (options?.isHumanModelStyle && productType === "گردنبند") {
    return [
      "Fine detail priority for a necklace on a model: preserve pendant shape, visible chain links, metal tone, stone settings, engravings, and front-facing design cues.",
      "Do not expose, invent, duplicate, or relocate a normal rear necklace clasp in the visible neck or collarbone area; hidden back hardware may stay hidden when worn.",
    ].join("\n");
  }

  return [
    "Fine detail priority: preserve engravings, edges, stone settings, clasp details, and other small visible design cues.",
    "Do not blur, simplify, repaint, or replace small product details with generic shapes.",
  ].join("\n");
}

function getProductImageSetInstruction(productImageCount: number) {
  if (productImageCount <= 1) {
    return "";
  }

  return [
    `Product identity references: use images 1-${productImageCount} together as views of the same product.`,
    "Image 1 is the primary composition/source image. The additional product images are supporting detail and angle references only.",
    "Use the supporting images to preserve complicated details such as clasp structure, side profile, gemstone layout, engraving, watch face markings, chain shape, material finish, and hidden edges.",
    "Do not create multiple products, a collage, or multiple outputs. Return one final product image.",
  ].join("\n");
}

export function buildGenerationPrompt({
  style,
  formData,
  vision,
  productImageCount = 1,
}: {
  style: GenerationPromptStyle;
  formData: FormData;
  vision?: GenerationPromptVision | null;
  productImageCount?: number;
}) {
  const outputPreset = normalizeOutputPreset(formData.get("outputPreset"));
  const baseStylePrompt = style.id === "style_sample_reference" ? SAMPLE_REFERENCE_BASE_PROMPT : style.prompt;
  const promptParts = [baseStylePrompt, getOutputPresetSpec(outputPreset).instruction];
  const visionContext = vision ? buildVisionPromptContext(vision) : "";
  const styleControlPrompt = buildStyleControlPrompt(style, formData);
  const includesHumanModel = isHumanWearableStyle(style);
  const submittedProductType = normalizeProductType(formData.get("productType"));
  const visionProductType = vision?.productType ? normalizeProductType(vision.productType) : null;
  const productType = visionProductType && visionProductType !== DEFAULT_PRODUCT_TYPE ? visionProductType : submittedProductType;

  if (includesHumanModel) {
    promptParts.push(
      "Model age and casting: if a human model appears, use a believable young adult model, generally 25 to 35 years old. Avoid elderly, childlike, teen, overly aged, tired, or heavily wrinkled faces and hands.",
    );
    promptParts.push(
      "Female hand modeling: when the selected model is a woman and the product is shown on hands or wrists, use elegant professional jewelry hand-model hands: slender natural fingers, graceful relaxed posing, neat short-to-medium natural nails, clean cuticles, refined proportions, and no rough, swollen, masculine, aged, dry, cracked, or work-worn hands.",
    );
    promptParts.push(
      "Human realism: preserve natural skin texture, visible pores, subtle fine lines, realistic hands, neck, ears, and skin tone variation. Avoid waxy, porcelain, airbrushed, plastic, doll-like, or AI-smoothed skin.",
    );
    promptParts.push(buildHumanModelProductWearPrompt(productType));
  }

  const productOnlyIsolationPrompt = buildProductOnlyIsolationPrompt({
    style,
    productType,
    visionAngle: vision?.visionAngle,
  });
  if (productOnlyIsolationPrompt) {
    promptParts.push(productOnlyIsolationPrompt);
  }

  if (styleControlPrompt) {
    promptParts.push(styleControlPrompt);
  }

  const styleCompositionInstruction = getStyleCompositionInstruction(style.id);
  if (styleCompositionInstruction) {
    promptParts.push(styleCompositionInstruction);
  }

  const productImageSetInstruction = getProductImageSetInstruction(productImageCount);
  if (productImageSetInstruction) {
    promptParts.push(productImageSetInstruction);
  }

  const referenceStyleInstruction = style.id === "style_sample_reference" ? buildSampleReferencePromptContext(null, productImageCount) : "";
  if (referenceStyleInstruction) {
    promptParts.push(referenceStyleInstruction);
  }

  const editorialBackgroundDecorInstruction = getEditorialBackgroundDecorInstruction(style.id);
  if (editorialBackgroundDecorInstruction) {
    promptParts.push(editorialBackgroundDecorInstruction);
  }

  promptParts.push(getCompositionInstruction(productType, vision?.visionAngle, { isHumanModelStyle: includesHumanModel }));
  promptParts.push(getFineDetailInstruction(productType, { isHumanModelStyle: includesHumanModel }));

  if (visionContext) {
    promptParts.push(visionContext);
  }

  return promptParts.join("\n");
}
