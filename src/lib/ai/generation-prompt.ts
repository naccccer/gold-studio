import { buildHumanModelProductWearPrompt, buildStyleControlPrompt } from "@/lib/ai/style-controls";
import { buildProductOnlyIsolationPrompt, isHumanWearableStyle } from "@/lib/ai/style-policy";
import { buildVisionPromptContext } from "@/lib/ai/vision";
import { getOutputPresetSpec, normalizeOutputPreset } from "@/lib/output-presets";
import { getDefaultProductType, normalizeProductType } from "@/lib/product-types";
import { buildSampleReferencePromptContext } from "@/lib/style-reference-vision";
import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

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
  "The uploaded product image or images are the only locked product identity source.",
  "Use the selected sample image as the target scene, composition, camera angle, lighting, mood, background, surface, props, water/fabric/material atmosphere, and non-product context only; it is not a product reference.",
  "Replace only the product/jewelry/accessory in the sample scene with the user's uploaded product, as if the original sample product was removed and the uploaded product was realistically placed there.",
  "Keep the sample scene recognizable, including hand, wrist, fingers, skin, body, pose, water, fabric, surface, reflections, shadows, props, crop, and lens feel when they are part of the sample composition.",
  "The user's uploaded product is locked: preserve its exact shape, stones, metal, engravings, proportions, silhouette, color, finish, gemstone layout, setting, and visible defects or details.",
  "Do not copy, mix in, or retain the sample product identity. Do not redesign, simplify, restyle, recolor, re-stone, unnaturally resize proportions, or invent a new product.",
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

function getFineDetailInstruction(productType?: string | null, options?: { isHumanModelStyle?: boolean; vertical?: VerticalId }) {
  if (options?.vertical === "food") {
    return [
      "Fine detail priority: preserve the exact food or drink identity, plating, portion shape, packaging, label placement, garnish, sauce pattern, texture, color, and visible freshness cues.",
      "Do not turn the item into a different dish, drink, dessert, package, flavor, brand, serving size, or cuisine. Keep ingredient details crisp and appetizing without making the result look synthetic.",
    ].join("\n");
  }

  if (productType === "ساعت") {
    return [
      "Fine detail priority: preserve the watch face layout, display structure, bezel markings, button placement, engravings, and case edges.",
      "Keep small functional details crisp and believable; do not blur, simplify, repaint, or replace them with generic shapes.",
    ].join("\n");
  }

  if (options?.isHumanModelStyle && productType === "گردنبند") {
    return [
      "Fine detail priority for a necklace on a model: preserve pendant shape, visible chain links, metal tone, stone settings, engravings, and front-facing design cues.",
      "Default clasp policy: no visible clasp in necklace-on-model outputs. Treat any normal necklace clasp, lobster clasp, spring-ring clasp, hook, fastener, or rear closure as back-of-neck hardware that should not appear in the visible image.",
      "Do not expose, invent, duplicate, enlarge, or relocate a normal rear necklace clasp in the visible neck, collarbone, shoulder, pendant, or side-front area. Hidden back hardware should stay hidden when worn.",
    ].join("\n");
  }

  return [
    "Fine detail priority: preserve engravings, edges, stone settings, clasp details, and other small visible design cues.",
    "Do not blur, simplify, repaint, or replace small product details with generic shapes.",
  ].join("\n");
}

function getFinalHumanWearableCorrection(productType?: string | null, options?: { isHumanModelStyle?: boolean }) {
  if (!options?.isHumanModelStyle || productType !== "گردنبند") {
    return "";
  }

  return [
    "Final necklace-on-model correction:",
    "Default policy: do not show a clasp in a necklace-on-model image. Assume any ordinary clasp or fastener in the source photo is a normal rear clasp unless it is unmistakably designed as a decorative front clasp.",
    "Ignore any earlier generic instruction to preserve or show clasp details when it conflicts with natural wearing. A natural worn necklace image does not need to show the rear clasp. Prefer a believable front or three-quarter model photo where the normal back clasp is completely hidden behind the neck.",
    "Never alter the pose, chain path, camera angle, crop, or product geometry to make a rear clasp visible. Do not place the clasp on the front of the neck, collarbone, shoulder, pendant area, or side-front chain.",
    "Negative constraint: no visible lobster clasp, spring-ring clasp, hook clasp, rear fastener, closure hardware, extra ring, or dangling clasp near the neck, collarbone, shoulder, pendant, or side-front chain.",
    "Only show a clasp if it is clearly a decorative front-facing clasp or front closure in the original product design; otherwise hide it naturally and preserve the pendant and visible chain instead.",
  ].join("\n");
}

function getProductImageSetInstruction(
  productImageCount: number,
  productType?: string | null,
  options?: { isHumanModelStyle?: boolean; vertical?: VerticalId },
) {
  if (productImageCount <= 1) {
    return "";
  }

  if (options?.vertical === "food") {
    return [
      `Product identity references: use images 1-${productImageCount} together as views of the same food or drink item.`,
      "Image 1 is the primary composition/source image. The additional images are supporting references for plating, packaging, label visibility, garnish, texture, scale, and ingredient detail only.",
      "Do not create multiple dishes, a collage, or multiple outputs. Return one final food/product image.",
    ].join("\n");
  }

  if (options?.isHumanModelStyle && productType === "گردنبند") {
    return [
      `Product identity references: use images 1-${productImageCount} together as views of the same necklace.`,
      "Image 1 is the primary composition/source image. The additional product images are supporting detail and angle references only.",
      "Use the supporting images to preserve pendant design, visible chain shape, metal tone, stone layout, engravings, material finish, and front-facing necklace details.",
      "If a supporting image shows the rear clasp, use it only as hidden construction knowledge. Do not render that rear clasp in the worn model output; it should disappear naturally behind the neck.",
      "Do not create multiple products, a collage, or multiple outputs. Return one final product image.",
    ].join("\n");
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
  vertical = DEFAULT_VERTICAL_ID,
}: {
  style: GenerationPromptStyle;
  formData: FormData;
  vision?: GenerationPromptVision | null;
  productImageCount?: number;
  vertical?: VerticalId;
}) {
  const outputPreset = normalizeOutputPreset(formData.get("outputPreset"));
  const baseStylePrompt = style.id === "style_sample_reference" ? SAMPLE_REFERENCE_BASE_PROMPT : style.prompt;
  const promptParts = [baseStylePrompt, getOutputPresetSpec(outputPreset).instruction];
  const visionContext = vision ? buildVisionPromptContext(vision) : "";
  const styleControlPrompt = buildStyleControlPrompt(style, formData);
  const includesHumanModel = isHumanWearableStyle(style);
  const submittedProductType = normalizeProductType(formData.get("productType"), vertical);
  const visionProductType = vision?.productType ? normalizeProductType(vision.productType, vertical) : null;
  const productType = visionProductType && visionProductType !== getDefaultProductType(vertical) ? visionProductType : submittedProductType;

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

  const productOnlyIsolationPrompt =
    vertical === "jewelry"
      ? buildProductOnlyIsolationPrompt({
          style,
          productType,
          visionAngle: vision?.visionAngle,
        })
      : "";
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

  const productImageSetInstruction = getProductImageSetInstruction(productImageCount, productType, { isHumanModelStyle: includesHumanModel, vertical });
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
  promptParts.push(getFineDetailInstruction(productType, { isHumanModelStyle: includesHumanModel, vertical }));

  if (visionContext) {
    promptParts.push(visionContext);
  }

  const finalWearableCorrection = getFinalHumanWearableCorrection(productType, { isHumanModelStyle: includesHumanModel });
  if (finalWearableCorrection) {
    promptParts.push(finalWearableCorrection);
  }

  return promptParts.join("\n");
}
