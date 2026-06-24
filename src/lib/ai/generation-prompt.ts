import { buildHumanModelProductWearPrompt, buildStyleControlPrompt } from "@/lib/ai/style-controls";
import { buildProductOnlyIsolationPrompt, isHumanWearableStyle } from "@/lib/ai/style-policy";
import { buildVisionPromptContext } from "@/lib/ai/vision";
import {
  buildCompositionPrompt,
  buildEditorialBackgroundDecorPrompt,
  buildFinalHumanWearableCorrectionPrompt,
  buildFineDetailPrompt,
  buildProductImageSetPrompt,
  buildSampleReferenceBasePrompt,
  buildStyleCompositionPrompt,
  buildVerticalFoundationPrompt,
} from "@/lib/ai/vertical-prompt-rules";
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
  const baseStylePrompt = style.id === "style_sample_reference" ? buildSampleReferenceBasePrompt(vertical) : style.prompt;
  const promptParts = [baseStylePrompt, getOutputPresetSpec(outputPreset).instruction];
  const styleControlPrompt = buildStyleControlPrompt(style, formData);
  const includesHumanModel = isHumanWearableStyle(style);
  const submittedProductType = normalizeProductType(formData.get("productType"), vertical);
  const visionProductType = vision?.productType ? normalizeProductType(vision.productType, vertical) : null;
  const productType = visionProductType && visionProductType !== getDefaultProductType(vertical) ? visionProductType : submittedProductType;
  const promptContext = {
    styleId: style.id,
    productType,
    visionAngle: vision?.visionAngle,
    productImageCount,
    isHumanModelStyle: includesHumanModel,
  };
  const visionContext = vision ? buildVisionPromptContext({ ...vision, productType, vertical }) : "";
  const verticalFoundationPrompt = buildVerticalFoundationPrompt(vertical, promptContext);

  if (verticalFoundationPrompt) {
    promptParts.push(verticalFoundationPrompt);
  }

  if (vertical === "jewelry" && includesHumanModel) {
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

  const styleCompositionPrompt = buildStyleCompositionPrompt(vertical, style.id);
  if (styleCompositionPrompt) {
    promptParts.push(styleCompositionPrompt);
  }

  const productImageSetPrompt = buildProductImageSetPrompt(vertical, promptContext);
  if (productImageSetPrompt) {
    promptParts.push(productImageSetPrompt);
  }

  const referenceStylePrompt = style.id === "style_sample_reference" ? buildSampleReferencePromptContext(null, productImageCount, vertical) : "";
  if (referenceStylePrompt) {
    promptParts.push(referenceStylePrompt);
  }

  const editorialBackgroundDecorPrompt = buildEditorialBackgroundDecorPrompt(vertical, style.id);
  if (editorialBackgroundDecorPrompt) {
    promptParts.push(editorialBackgroundDecorPrompt);
  }

  promptParts.push(buildCompositionPrompt(vertical, promptContext));
  promptParts.push(buildFineDetailPrompt(vertical, promptContext));

  if (visionContext) {
    promptParts.push(visionContext);
  }

  const finalWearableCorrection = buildFinalHumanWearableCorrectionPrompt(vertical, promptContext);
  if (finalWearableCorrection) {
    promptParts.push(finalWearableCorrection);
  }

  return promptParts.join("\n");
}
