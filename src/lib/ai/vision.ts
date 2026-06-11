import { normalizeProductType, type ProductType } from "@/lib/product-types";

const DEFAULT_LIARA_BASE_URL = "https://ai.liara.ir/api/69fe30c50bb427e049d327f6/v1";
const DEFAULT_LIARA_VISION_MODEL = "google/gemini-2.0-flash-lite-001";
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

type AnalyzeProductImageInput = {
  sourceBuffer: Buffer;
  mimeType: string;
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

function getLiaraVisionConfig() {
  const visionApiKey = readEnv("LIARA_VISION_API_KEY", ["GAPGPT_VISION_API_KEY"]);
  const liaraApiKey = visionApiKey || readEnv("LIARA_API_KEY", ["liara_API_KEY"]);
  const apiKey = liaraApiKey || readEnv("GAPGPT_API_KEY");
  if (!apiKey) {
    throw new Error("LIARA_VISION_API_KEY or LIARA_API_KEY env var is required.");
  }

  return {
    apiKey,
    baseURL:
      (visionApiKey || liaraApiKey ? readEnv("LIARA_BASE_URL") : readEnv("LIARA_BASE_URL", ["GAPGPT_BASE_URL"])) ||
      DEFAULT_LIARA_BASE_URL,
    model:
      (visionApiKey || liaraApiKey ? readEnv("LIARA_VISION_MODEL") : readEnv("LIARA_VISION_MODEL", ["GAPGPT_VISION_MODEL"])) ||
      DEFAULT_LIARA_VISION_MODEL,
  };
}

export function liaraVisionModel() {
  return process.env.LIARA_VISION_MODEL?.trim() || process.env.GAPGPT_VISION_MODEL?.trim() || DEFAULT_LIARA_VISION_MODEL;
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

export function normalizeVisionMetadata(raw: unknown): ProductVisionMetadata {
  const value = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : {};
  const productType = normalizeProductType(value.productType);

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

function parseVisionMetadata(content: unknown) {
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

  return normalizeVisionMetadata(JSON.parse(extractJsonObject(text)));
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

export async function analyzeProductImageWithLiara({
  sourceBuffer,
  mimeType,
}: AnalyzeProductImageInput): Promise<ProductVisionMetadata> {
  const { apiKey, baseURL, model } = getLiaraVisionConfig();
  const imageUrl = `data:${mimeType};base64,${sourceBuffer.toString("base64")}`;
  const prompt = [
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
    throw new Error(`Liara vision request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`);
  }

  const result = await response.json() as ChatCompletionResponse;
  return parseVisionMetadata(result.choices?.[0]?.message?.content);
}

export async function analyzeStyleReferenceImageWithLiara({
  sourceBuffer,
  mimeType,
}: AnalyzeProductImageInput): Promise<StyleReferenceVisionMetadata> {
  const { apiKey, baseURL, model } = getLiaraVisionConfig();
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
    throw new Error(`Liara reference vision request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`);
  }

  const result = await response.json() as ChatCompletionResponse;
  return parseStyleReferenceVisionMetadata(result.choices?.[0]?.message?.content);
}

export function buildVisionPromptContext(input: {
  productType?: string | null;
  visionDescription?: string | null;
  visionConfidence?: number | null;
}) {
  const productType = normalizeProductType(input.productType);
  const description = normalizeDescription(input.visionDescription);
  const confidence = clampConfidence(input.visionConfidence);

  if (!description || confidence < MIN_METADATA_CONFIDENCE) {
    return "";
  }

  return [
    `Product metadata: user-confirmed type is "${productType}"; visual description: "${description}".`,
    "Use this only as supporting context. The input image remains the source of truth for product identity, materials, color, stones, shape, engravings, and all visible details.",
  ].join("\n");
}

export function serializeQualityIssues(issues: VisionQualityIssue[]) {
  return JSON.stringify(normalizeQualityIssues(issues));
}
