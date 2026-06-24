import { isSampleReferenceStyleId } from "@/lib/ai/style-policy";

export type ImageProviderId = "liara" | "avalai";

export const LIARA_IMAGE_MODELS = [
  "google/gemini-3-pro-image-preview",
  "google/gemini-2.5-flash-image",
  "openai/gpt-image-2",
] as const;

export const AVALAI_IMAGE_MODELS = [
  "gemini-3-pro-image",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-image-preview",
  "gpt-image-2",
] as const;

export const SUPPORTED_IMAGE_MODELS = [...LIARA_IMAGE_MODELS, ...AVALAI_IMAGE_MODELS] as const;

export type SupportedImageModel = (typeof SUPPORTED_IMAGE_MODELS)[number];

export type ProviderModelAttempt = {
  provider: ImageProviderId;
  model: SupportedImageModel;
};

export type ModelRoutingContext = {
  styleId?: string | null;
  referenceUsed?: boolean | null;
  supportingImageCount?: number | null;
  operation?: string | null;
};

export type ModelRoutingDecision = {
  routing: "hard" | "easy";
  reason: "style_with_model" | "style_sample_reference" | "default";
};

const HARD_STYLE_IDS = new Set(["style_with_model"]);

const MODEL_ORDER: Record<ImageProviderId, Record<ModelRoutingDecision["routing"], SupportedImageModel[]>> = {
  avalai: {
    hard: ["gemini-3-pro-image", "gemini-3-pro-image-preview", "gemini-3.1-flash-image", "gemini-3.1-flash-image-preview", "gpt-image-2"],
    easy: ["gemini-3.1-flash-image", "gemini-3.1-flash-image-preview", "gemini-3-pro-image", "gemini-3-pro-image-preview", "gpt-image-2"],
  },
  liara: {
    hard: ["google/gemini-3-pro-image-preview", "google/gemini-2.5-flash-image", "openai/gpt-image-2"],
    easy: ["google/gemini-2.5-flash-image", "google/gemini-3-pro-image-preview", "openai/gpt-image-2"],
  },
};

export function providerImageModels(provider: ImageProviderId) {
  return provider === "avalai" ? [...AVALAI_IMAGE_MODELS] : [...LIARA_IMAGE_MODELS];
}

export function resolveModelRoutingDecision(context?: ModelRoutingContext | null): ModelRoutingDecision {
  const styleId = context?.styleId?.trim() || "";
  if (styleId && (HARD_STYLE_IDS.has(styleId) || isSampleReferenceStyleId(styleId))) {
    return {
      routing: "hard",
      reason: isSampleReferenceStyleId(styleId) ? "style_sample_reference" : "style_with_model",
    };
  }

  return {
    routing: "easy",
    reason: "default",
  };
}

export function providerImageModelsForRouting(provider: ImageProviderId, routing: ModelRoutingDecision["routing"]) {
  const supportedModels = new Set(providerImageModels(provider));
  return MODEL_ORDER[provider][routing].filter((model) => supportedModels.has(model));
}

export function clampNon4KImageSetting(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim() || fallback;
  return normalized === "4K" ? "2K" : normalized;
}
