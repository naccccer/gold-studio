import { normalizeProductType, type ProductType } from "@/lib/product-types";
import { imageProvider, normalizeImageProvider, type ImageProvider } from "@/lib/ai/provider";
import {
  buildVisionAnalysisPrompt,
  buildVisionContextTruthSourcePrompt,
} from "@/lib/ai/vertical-prompt-rules";
import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

const DEFAULT_LIARA_BASE_URL = "https://ai.liara.ir/api/69fe30c50bb427e049d327f6/v1";
const DEFAULT_LIARA_VISION_MODEL = "google/gemini-2.0-flash-lite-001";
const DEFAULT_AVALAI_BASE_URL = "https://api.avalai.ir/v1";
const DEFAULT_AVALAI_VISION_MODEL = "gemini-3.1-flash-lite";
const ANGLES = ["front", "top", "side", "three-quarter", "close-up", "worn", "unknown"] as const;
const QUALITY_ISSUES = ["low_light", "blur", "busy_background", "cropped", "reflection", "none"] as const;
const MIN_METADATA_CONFIDENCE = 0.55;

export type VisionAngle = (typeof ANGLES)[number];
export type VisionQualityIssue = (typeof QUALITY_ISSUES)[number];

export type ProductVisionMetadata = {
  shortTitle: string | null;
  productType: ProductType;
  confidence: number;
  internalDescription: string | null;
  detectedAngle: VisionAngle;
  qualityIssues: VisionQualityIssue[];
};

export type StyleReferenceVisionMetadata = {
  sceneDescription: string | null;
  cameraAngle: VisionAngle;
  lighting: string | null;
  background: string | null;
  subjectDescription: string | null;
  confidence: number;
};

export type QualityReviewVisionMetadata = {
  identityScore: number;
  severity: "low" | "medium" | "high";
  recommendation: "APPROVE" | "REVIEW" | "REJECT";
  summary: string | null;
  differences: string[];
};

type AnalyzeProductImageInput = {
  sourceBuffer: Buffer;
  mimeType: string;
  provider?: ImageProvider;
  vertical?: VerticalId;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

function readEnv(primaryName: string, fallbackNames: string[] = []) {
  for (const name of [primaryName, ...fallbackNames]) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function visionProvider(providerOverride?: ImageProvider): ImageProvider {
  return normalizeImageProvider(process.env.VISION_PROVIDER || providerOverride || imageProvider());
}

function getVisionConfig(providerOverride?: ImageProvider) {
  if (visionProvider(providerOverride) === "avalai") {
    const apiKey = readEnv("AVALAI_API_KEY");
    if (!apiKey) {
      throw new Error("AVALAI_API_KEY env var is required.");
    }

    return {
      provider: "avalai" as const,
      apiKey,
      baseURL: readEnv("AVALAI_BASE_URL") || DEFAULT_AVALAI_BASE_URL,
      model: readEnv("AVALAI_VISION_MODEL") || DEFAULT_AVALAI_VISION_MODEL,
    };
  }

  const visionApiKey = readEnv("LIARA_VISION_API_KEY", ["GAPGPT_VISION_API_KEY"]);
  const liaraApiKey = visionApiKey || readEnv("LIARA_API_KEY", ["liara_API_KEY"]);
  const apiKey = liaraApiKey || readEnv("GAPGPT_API_KEY");
  if (!apiKey) {
    throw new Error("LIARA_VISION_API_KEY or LIARA_API_KEY env var is required.");
  }

  return {
    provider: "liara" as const,
    apiKey,
    baseURL:
      (visionApiKey || liaraApiKey ? readEnv("LIARA_BASE_URL") : readEnv("LIARA_BASE_URL", ["GAPGPT_BASE_URL"])) ||
      DEFAULT_LIARA_BASE_URL,
    model:
      (visionApiKey || liaraApiKey ? readEnv("LIARA_VISION_MODEL") : readEnv("LIARA_VISION_MODEL", ["GAPGPT_VISION_MODEL"])) ||
      DEFAULT_LIARA_VISION_MODEL,
  };
}

export function visionModel(providerOverride?: ImageProvider) {
  if (visionProvider(providerOverride) === "avalai") {
    return process.env.AVALAI_VISION_MODEL?.trim() || DEFAULT_AVALAI_VISION_MODEL;
  }

  return process.env.LIARA_VISION_MODEL?.trim() || process.env.GAPGPT_VISION_MODEL?.trim() || DEFAULT_LIARA_VISION_MODEL;
}

export function liaraVisionModel() {
  return visionModel();
}

function extractJsonObject(value: string) {
  const trimmed = value.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Vision response did not contain a JSON object.");
  }

  return trimmed.slice(start, end + 1);
}

function clampConfidence(value: unknown) {
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.min(1, Math.max(0, numeric));
}

function normalizeShortTitle(value: unknown, productType: ProductType) {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!text) {
    return productType;
  }

  const words = text.split(" ").filter(Boolean).slice(0, 5);
  return words.join(" ") || productType;
}

function normalizeAngle(value: unknown): VisionAngle {
  const text = typeof value === "string" ? value.trim() : "";
  return ANGLES.includes(text as VisionAngle) ? (text as VisionAngle) : "unknown";
}

function normalizeQualityIssues(value: unknown): VisionQualityIssue[] {
  const values = Array.isArray(value) ? value : ["none"];
  const normalized = values
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is VisionQualityIssue => QUALITY_ISSUES.includes(item as VisionQualityIssue));

  if (normalized.length === 0 || normalized.includes("none")) {
    return ["none"];
  }

  return Array.from(new Set(normalized));
}

function normalizeDescription(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 600) : null;
}

function normalizeQualityReviewRecommendation(value: unknown): QualityReviewVisionMetadata["recommendation"] {
  const text = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (text === "APPROVE" || text === "REJECT") {
    return text;
  }

  return "REVIEW";
}

function normalizeQualityReviewSeverity(value: unknown): QualityReviewVisionMetadata["severity"] {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (text === "low" || text === "medium" || text === "high") {
    return text;
  }

  return "medium";
}

function normalizeDifferenceList(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  return values
    .map((item) => (typeof item === "string" ? item.replace(/\s+/g, " ").trim() : ""))
    .filter(Boolean)
    .slice(0, 8);
}

export function normalizeVisionMetadata(raw: unknown, vertical: VerticalId = DEFAULT_VERTICAL_ID): ProductVisionMetadata {
  const value = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : {};
  const productType = normalizeProductType(value.productType, vertical);

  return {
    shortTitle: normalizeShortTitle(value.shortTitle, productType),
    productType,
    confidence: clampConfidence(value.confidence),
    internalDescription: normalizeDescription(value.internalDescription),
    detectedAngle: normalizeAngle(value.detectedAngle),
    qualityIssues: normalizeQualityIssues(value.qualityIssues),
  };
}

export function normalizeStyleReferenceVisionMetadata(raw: unknown): StyleReferenceVisionMetadata {
  const value = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : {};

  return {
    sceneDescription: normalizeDescription(value.sceneDescription),
    cameraAngle: normalizeAngle(value.cameraAngle),
    lighting: normalizeDescription(value.lighting),
    background: normalizeDescription(value.background),
    subjectDescription: normalizeDescription(value.subjectDescription),
    confidence: clampConfidence(value.confidence),
  };
}

export function normalizeQualityReviewVisionMetadata(raw: unknown): QualityReviewVisionMetadata {
  const value = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : {};

  return {
    identityScore: clampConfidence(value.identityScore),
    severity: normalizeQualityReviewSeverity(value.severity),
    recommendation: normalizeQualityReviewRecommendation(value.recommendation),
    summary: normalizeDescription(value.summary),
    differences: normalizeDifferenceList(value.differences),
  };
}

function parseVisionMetadata(content: unknown, vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  const text = Array.isArray(content)
    ? content.map((part) => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null && "text" in part && typeof part.text === "string") return part.text;
        return "";
      }).join("\n")
    : typeof content === "string"
      ? content
      : "";

  if (!text) {
    throw new Error("Vision response was empty.");
  }

  return normalizeVisionMetadata(JSON.parse(extractJsonObject(text)), vertical);
}

function parseStyleReferenceVisionMetadata(content: unknown) {
  const text = Array.isArray(content)
    ? content.map((part) => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null && "text" in part && typeof part.text === "string") return part.text;
        return "";
      }).join("\n")
    : typeof content === "string"
      ? content
      : "";

  if (!text) {
    throw new Error("Vision response was empty.");
  }

  return normalizeStyleReferenceVisionMetadata(JSON.parse(extractJsonObject(text)));
}

function parseQualityReviewVisionMetadata(content: unknown) {
  const text = Array.isArray(content)
    ? content.map((part) => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null && "text" in part && typeof part.text === "string") return part.text;
        return "";
      }).join("\n")
    : typeof content === "string"
      ? content
      : "";

  if (!text) {
    throw new Error("Quality review vision response was empty.");
  }

  return normalizeQualityReviewVisionMetadata(JSON.parse(extractJsonObject(text)));
}

export async function analyzeProductImageWithLiara({
  sourceBuffer,
  mimeType,
  provider: providerOverride,
  vertical = DEFAULT_VERTICAL_ID,
}: AnalyzeProductImageInput): Promise<ProductVisionMetadata> {
  const { apiKey, baseURL, model, provider } = getVisionConfig(providerOverride);
  const imageUrl = `data:${mimeType};base64,${sourceBuffer.toString("base64")}`;
  const prompt = buildVisionAnalysisPrompt(vertical);
  void [
    "You are a vision assistant for Ovala, a Persian RTL jewelry product-photo app.",
    "Analyze the uploaded product photo. The photo may be low quality, poorly lit, cropped, or have a busy background.",
    "Return ONLY valid JSON. Do not use markdown. Do not add explanations.",
    "Rules:",
    "- The project title must be in Persian.",
    "- The project title must be 2 to 5 words maximum.",
    "- Prefer specific product names over generic names.",
    "- Include one clearly visible differentiator when possible: shape, color, material, stone, motif, chain style, or set composition.",
    "- Do not mention photography style in the title.",
    "- If unsure, choose a safe generic product type.",
    "- Do not invent brand names, gemstones, or materials unless clearly visible.",
    "- If the image contains multiple coordinated product types, use productType \"ست\".",
    "- If the image contains multiple pieces of the same product type, use that product type, not \"ست\".",
    "Allowed product types: انگشتر، گردنبند، دستبند، گوشواره، ساعت، پابند، سنجاق، ست، اکسسوری، محصول",
    "Return this exact JSON shape:",
    "{\"shortTitle\":\"string in Persian, 2-5 words\",\"productType\":\"one allowed Persian product type\",\"confidence\":0.0,\"internalDescription\":\"short English description of the visible product only\",\"detectedAngle\":\"front | top | side | three-quarter | close-up | worn | unknown\",\"qualityIssues\":[\"low_light\",\"blur\",\"busy_background\",\"cropped\",\"reflection\",\"none\"]}",
  ].join("\n");

  const response = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    throw new Error(`${provider} vision request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`);
  }

  const result = await response.json() as ChatCompletionResponse;
  return parseVisionMetadata(result.choices?.[0]?.message?.content, vertical);
}

export async function analyzeStyleReferenceImageWithLiara({
  sourceBuffer,
  mimeType,
  provider: providerOverride,
}: AnalyzeProductImageInput): Promise<StyleReferenceVisionMetadata> {
  const { apiKey, baseURL, model, provider } = getVisionConfig(providerOverride);
  const imageUrl = `data:${mimeType};base64,${sourceBuffer.toString("base64")}`;
  const prompt = [
    "You are a vision assistant for Ovala, a Persian RTL jewelry product-photo app.",
    "Analyze this sample/reference image as a scene template for image editing.",
    "The sample product identity is NOT important except to locate what should be replaced.",
    "Focus on the scene, camera angle, product placement, surface, background, props, lighting, shadows, color palette, mood, and framing.",
    "Return ONLY valid JSON. Do not use markdown. Do not add explanations.",
    "Rules:",
    "- Describe how a different user product should be placed into the same setup.",
    "- Mention whether the view is front, top, side, three-quarter, close-up, worn, or unknown.",
    "- Describe the visible sample subject/product only so it can be removed/replaced, not copied.",
    "- Do not invent hidden props, brands, materials, or scene details.",
    "Return this exact JSON shape:",
    "{\"sceneDescription\":\"short English description of the setup, composition, product placement, mood, and framing\",\"cameraAngle\":\"front | top | side | three-quarter | close-up | worn | unknown\",\"lighting\":\"short English description of lighting direction, softness, contrast, shadows, and reflections\",\"background\":\"short English description of background, surface, props, colors, and negative space\",\"subjectDescription\":\"short English description of the sample product/subject that must be replaced\",\"confidence\":0.0}",
  ].join("\n");

  const response = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    throw new Error(`${provider} reference vision request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`);
  }

  const result = await response.json() as ChatCompletionResponse;
  return parseStyleReferenceVisionMetadata(result.choices?.[0]?.message?.content);
}

export async function analyzeQualityReviewImagesWithLiara({
  sourceBuffer,
  sourceMimeType,
  resultBuffer,
  resultMimeType,
  provider: providerOverride,
}: {
  sourceBuffer: Buffer;
  sourceMimeType: string;
  resultBuffer: Buffer;
  resultMimeType: string;
  provider?: ImageProvider;
}): Promise<QualityReviewVisionMetadata> {
  const { apiKey, baseURL, model, provider } = getVisionConfig(providerOverride);
  const sourceImageUrl = `data:${sourceMimeType};base64,${sourceBuffer.toString("base64")}`;
  const resultImageUrl = `data:${resultMimeType};base64,${resultBuffer.toString("base64")}`;
  const prompt = [
    "You are a quality-review assistant for Ovala, a Persian RTL jewelry product-photo app.",
    "Compare image 1, the user's original product photo, with image 2, the generated output.",
    "Judge only whether the product identity was preserved. Ignore background, lighting, framing, cleanup, and studio styling unless they hide or alter the product.",
    "Pay close attention to jewelry/watch details: shape, silhouette, metal color, stone count and placement, chain or clasp design when visible, watch face, engravings, settings, proportions, and distinctive motifs.",
    "Return ONLY valid JSON. Do not use markdown. Do not add explanations.",
    "Recommendation rules:",
    "- APPROVE means a refund is likely fair because the output clearly changed the product identity or removed important visible details.",
    "- REJECT means the product identity is mostly preserved and differences are mainly style, lighting, background, crop, or expected cleanup.",
    "- REVIEW means uncertainty or mixed evidence; a human admin should decide.",
    "Return this exact JSON shape:",
    "{\"identityScore\":0.0,\"severity\":\"low | medium | high\",\"recommendation\":\"APPROVE | REVIEW | REJECT\",\"summary\":\"short Persian summary for admin triage\",\"differences\":[\"short Persian difference\"]}",
  ].join("\n");

  const response = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: sourceImageUrl } },
            { type: "image_url", image_url: { url: resultImageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    throw new Error(`${provider} quality review vision request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`);
  }

  const result = await response.json() as ChatCompletionResponse;
  return parseQualityReviewVisionMetadata(result.choices?.[0]?.message?.content);
}

export function buildVisionPromptContext(input: {
  productType?: string | null;
  visionDescription?: string | null;
  visionConfidence?: number | null;
  vertical?: VerticalId;
}) {
  const vertical = input.vertical ?? DEFAULT_VERTICAL_ID;
  const productType = normalizeProductType(input.productType, vertical);
  const description = normalizeDescription(input.visionDescription);
  const confidence = clampConfidence(input.visionConfidence);

  if (!description || confidence < MIN_METADATA_CONFIDENCE) {
    return "";
  }

  return [
    `Product metadata: user-confirmed type is "${productType}"; visual description: "${description}".`,
    buildVisionContextTruthSourcePrompt(vertical),
  ].join("\n");
}

export function serializeQualityIssues(issues: VisionQualityIssue[]) {
  return JSON.stringify(normalizeQualityIssues(issues));
}
