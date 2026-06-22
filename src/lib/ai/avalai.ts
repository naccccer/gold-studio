import { getOutputPresetSpec } from "@/lib/output-presets";
import { clampNon4KImageSetting } from "@/lib/ai/model-routing";
import type { GeneratedImageResult } from "@/lib/ai/provider";

const DEFAULT_AVALAI_BASE_URL = "https://api.avalai.ir/v1";
const DEFAULT_AVALAI_IMAGE_MODEL = "gemini-3.1-flash-image";
const DEFAULT_AVALAI_IMAGE_SIZE = "2K";
const DEFAULT_OPENAI_IMAGE_SIZE = "1024x1024";
const DEFAULT_REQUEST_TIMEOUT_MS = 300000;
const TRANSIENT_RETRY_DELAYS_MS = [1500, 4000, 9000];
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_NETWORK_PATTERNS = [
  "client network socket disconnected before secure tls connection was established",
  "econnreset",
  "eacces",
  "etimedout",
  "eai_again",
  "enotfound",
  "und_err_socket",
  "und_err_connect_timeout",
  "operation not permitted",
  "socket hang up",
  "fetch failed",
  "tls connection",
];
const GENERATION_PROMPT_SUFFIX = [
  "Return one final premium studio product image based on the input product photo.",
  "The input product is the strict identity reference. Preserve the exact product shape, proportions, silhouette, metal color, gemstone count and placement, visible chain or front-facing clasp design when naturally visible, watch face, engravings, material finish, and all visible jewelry details.",
  "Do not expose, invent, duplicate, or relocate hidden backs, rear clasps, closures, posts, undersides, or hardware just to show construction details.",
  "Do not redesign, simplify, add, remove, replace, resize, recolor, or hallucinate product parts.",
  "Do not default every output to a tight close-up. Prefer balanced studio framing with clean negative space around the product, while allowing closer detail framing when it clearly benefits the product or selected style.",
  "Make the image look like a real high-end studio photograph with natural optics, believable lighting, realistic reflections, and true material texture.",
  "Avoid AI-looking gloss, CGI, 3D render, plastic surfaces, over-smoothing, over-sharpening, artificial sparkle, surreal lighting, distorted geometry, and fake luxury effects.",
].join("\n");
const REFERENCE_SCENE_PROMPT_SUFFIX = [
  "Return one final premium product image using the provided image order and labels.",
  "The primary product identity reference and any supporting product angles are the only product identity sources.",
  "The sample scene reference is scene and composition only, not product identity. Replace only the sample product/jewelry/accessory with the uploaded product.",
  "Preserve the exact uploaded product shape, proportions, silhouette, metal color, gemstone count and placement, visible chain or front-facing clasp design when naturally visible, watch face, engravings, setting, material finish, visible defects, and all visible jewelry details.",
  "Do not copy, mix in, retain, or reinterpret the sample product identity.",
  "Integrate the uploaded product realistically into the sample scene with believable perspective, scale, contact shadows, occlusion, reflections, lighting, depth of field, hand/finger wrapping, water distortion, and physical placement when present.",
  "Avoid AI-looking gloss, CGI, 3D render, plastic surfaces, over-smoothing, over-sharpening, artificial sparkle, surreal lighting, distorted geometry, and fake luxury effects.",
].join("\n");

type PreparedImage = {
  buffer: Buffer;
  mimeType: string;
};

type GenerateImageInput = {
  sourceBuffer: Buffer;
  mimeType: string;
  supportingImages?: PreparedImage[] | null;
  referenceBuffer?: Buffer | null;
  referenceMimeType?: string | null;
  stylePrompt: string;
  outputPreset?: string | null;
  model?: string | null;
};

type GenerateTextImageInput = {
  prompt: string;
  stylePrompt: string;
  outputPreset?: string | null;
  model?: string | null;
};

type ChatImage = {
  image_url?: {
    url?: unknown;
  };
  url?: unknown;
  b64_json?: unknown;
};

type ChatChoice = {
  message?: {
    images?: unknown;
    content?: unknown;
  };
};

type ChatCompletionImageResponse = {
  choices?: ChatChoice[];
};

type ImagesResponse = {
  data?: Array<{
    b64_json?: string | null;
    url?: string | null;
  }>;
};

type ChatContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
      };
    };

class AvalaiGenerationError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AvalaiGenerationError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

function readEnv(primaryName: string) {
  const value = process.env[primaryName]?.trim();
  return value || undefined;
}

function getAvalaiConfig() {
  const apiKey = readEnv("AVALAI_API_KEY");
  if (!apiKey) {
    throw new AvalaiGenerationError("AVALAI_API_KEY env var is required.");
  }

  return {
    apiKey,
    baseURL: readEnv("AVALAI_BASE_URL") || DEFAULT_AVALAI_BASE_URL,
    model: readEnv("AVALAI_IMAGE_MODEL") || DEFAULT_AVALAI_IMAGE_MODEL,
    imageSize: clampNon4KImageSetting(readEnv("AVALAI_IMAGE_SIZE"), DEFAULT_AVALAI_IMAGE_SIZE),
    openAIImageQuality: readEnv("AVALAI_OPENAI_IMAGE_QUALITY") || "high",
    responseFormat: readEnv("AVALAI_RESPONSE_FORMAT"),
    aspectRatio: readEnv("AVALAI_ASPECT_RATIO"),
  };
}

export function avalaiModel() {
  return readEnv("AVALAI_IMAGE_MODEL") || DEFAULT_AVALAI_IMAGE_MODEL;
}

function getRequestTimeoutMs() {
  const configured = Number.parseInt(process.env.AVALAI_IMAGE_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(configured) && configured >= 10000 ? configured : DEFAULT_REQUEST_TIMEOUT_MS;
}

function getAspectRatio(outputPreset: string | null | undefined, configuredAspectRatio: string | undefined) {
  if (outputPreset) {
    return getOutputPresetSpec(outputPreset).providerSize;
  }

  return configuredAspectRatio || "1:1";
}

function isOpenAIImageModel(model: string) {
  return model.startsWith("gpt-image-");
}

function getOpenAIImageSize(outputPreset: string | null | undefined) {
  if (outputPreset === "story") return "1024x1536";
  if (outputPreset === "banner") return "1536x1024";
  return DEFAULT_OPENAI_IMAGE_SIZE;
}

function toDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function generationPromptSuffix(hasReferenceScene: boolean) {
  return hasReferenceScene ? REFERENCE_SCENE_PROMPT_SUFFIX : GENERATION_PROMPT_SUFFIX;
}

function dataUrlToImage(url: string) {
  const match = url.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    imageBuffer: Buffer.from(match[2], "base64"),
    mimeType: match[1],
  };
}

function retryDelay(attemptIndex: number) {
  const baseDelay = TRANSIENT_RETRY_DELAYS_MS[attemptIndex] ?? TRANSIENT_RETRY_DELAYS_MS[TRANSIENT_RETRY_DELAYS_MS.length - 1];
  return baseDelay + Math.floor(Math.random() * 350);
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withRequestTimeout<T>(label: string, operation: (signal: AbortSignal) => Promise<T>) {
  const timeoutMs = getRequestTimeoutMs();
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const operationPromise = operation(controller.signal);
  operationPromise.catch(() => {});

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new AvalaiGenerationError(`${label} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operationPromise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function collectErrorText(error: unknown, depth = 0): string {
  if (depth > 3 || typeof error !== "object" || error === null) {
    return typeof error === "string" ? error : "";
  }

  const maybeError = error as {
    message?: unknown;
    code?: unknown;
    cause?: unknown;
    error?: { message?: unknown; code?: unknown };
  };

  return [
    typeof maybeError.message === "string" ? maybeError.message : "",
    typeof maybeError.code === "string" ? maybeError.code : "",
    typeof maybeError.error?.message === "string" ? maybeError.error.message : "",
    typeof maybeError.error?.code === "string" ? maybeError.error.code : "",
    collectErrorText(maybeError.cause, depth + 1),
  ].join(" ");
}

function statusFromError(error: unknown, depth = 0): number | null {
  if (depth > 3 || typeof error !== "object" || error === null) {
    return null;
  }

  const maybeError = error as {
    status?: unknown;
    cause?: unknown;
    error?: { status?: unknown };
  };

  if (typeof maybeError.status === "number") {
    return maybeError.status;
  }

  if (typeof maybeError.error?.status === "number") {
    return maybeError.error.status;
  }

  return statusFromError(maybeError.cause, depth + 1);
}

function isRetryableProviderError(error: unknown) {
  const status = statusFromError(error);
  if (status !== null) {
    return RETRYABLE_HTTP_STATUSES.has(status);
  }

  const message = collectErrorText(error).toLowerCase();
  const statusMatch = message.match(/\bstatus\s+(\d{3})\b/);
  if (statusMatch && RETRYABLE_HTTP_STATUSES.has(Number.parseInt(statusMatch[1], 10))) {
    return true;
  }

  return RETRYABLE_NETWORK_PATTERNS.some((pattern) => message.includes(pattern));
}

async function withTransientRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= TRANSIENT_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === TRANSIENT_RETRY_DELAYS_MS.length || !isRetryableProviderError(error)) {
        throw error;
      }

      await wait(retryDelay(attempt));
    }
  }

  throw lastError;
}

async function fetchGeneratedImage(url: string) {
  const response = await withRequestTimeout("Avalai image download", (signal) => fetch(url, { signal }));
  if (!response.ok) {
    throw new AvalaiGenerationError(`Avalai image download failed with status ${response.status}.`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/png";
  return {
    imageBuffer: Buffer.from(await response.arrayBuffer()),
    mimeType,
  };
}

function normalizeChatImages(value: unknown): ChatImage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is ChatImage => typeof item === "object" && item !== null);
}

async function extractGeneratedImage(response: ChatCompletionImageResponse) {
  const message = response.choices?.[0]?.message;
  const image = normalizeChatImages(message?.images)[0];
  const dataUrl = typeof image?.image_url?.url === "string" ? image.image_url.url : typeof image?.url === "string" ? image.url : "";
  const b64Json = typeof image?.b64_json === "string" ? image.b64_json : "";

  if (dataUrl) {
    const parsed = dataUrlToImage(dataUrl);
    if (parsed) {
      return parsed;
    }

    return fetchGeneratedImage(dataUrl);
  }

  if (b64Json) {
    return {
      imageBuffer: Buffer.from(b64Json, "base64"),
      mimeType: "image/png",
    };
  }

  throw new AvalaiGenerationError("Avalai did not return an image.");
}

async function extractGeneratedImageFromImagesResponse(response: ImagesResponse) {
  const output = response.data?.[0];
  if (output?.b64_json) {
    return {
      imageBuffer: Buffer.from(output.b64_json, "base64"),
      mimeType: "image/png",
    };
  }

  if (output?.url) {
    return fetchGeneratedImage(output.url);
  }

  throw new AvalaiGenerationError("Avalai did not return an image.");
}

async function postAvalaiJson<T>({
  baseURL,
  apiKey,
  path,
  body,
}: {
  baseURL: string;
  apiKey: string;
  path: string;
  body: unknown;
}) {
  const response = await withRequestTimeout("Avalai JSON request", (signal) =>
    fetch(`${baseURL.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    }),
  );

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }

    throw new AvalaiGenerationError(`Avalai request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`);
  }

  return (await response.json()) as T;
}

async function postAvalaiForm<T>({
  baseURL,
  apiKey,
  path,
  body,
}: {
  baseURL: string;
  apiKey: string;
  path: string;
  body: FormData;
}) {
  const response = await withRequestTimeout("Avalai multipart request", (signal) =>
    fetch(`${baseURL.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      signal,
    }),
  );

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }

    throw new AvalaiGenerationError(`Avalai request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`);
  }

  return (await response.json()) as T;
}

function buildImageContent({
  sourceBuffer,
  mimeType,
  supportingImages,
  referenceBuffer,
  referenceMimeType,
  stylePrompt,
}: Omit<GenerateImageInput, "outputPreset" | "model">): ChatContentPart[] {
  const content: ChatContentPart[] = [
    { type: "text", text: `${stylePrompt}\n\n${generationPromptSuffix(Boolean(referenceBuffer))}` },
    { type: "text", text: "Primary product identity reference. This uploaded image is the locked product source:" },
    { type: "image_url", image_url: { url: toDataUrl(sourceBuffer, mimeType) } },
  ];

  for (const [index, supportingImage] of (supportingImages ?? []).entries()) {
    content.push({ type: "text", text: `Supporting product identity angle ${index + 1}. Use only for product details:` });
    content.push({ type: "image_url", image_url: { url: toDataUrl(supportingImage.buffer, supportingImage.mimeType) } });
  }

  if (referenceBuffer) {
    content.push({
      type: "text",
      text: "Sample scene reference. This image is scene and composition only, not product identity. Keep its non-product scene recognizable, including hand, wrist, fingers, skin, water, surface, props, lighting, shadows, reflections, camera angle, lens feel, crop, and pose when present. Replace only the sample product/jewelry/accessory with the uploaded product identity from the primary product reference. Do not copy or retain the sample product identity.",
    });
    content.push({ type: "image_url", image_url: { url: toDataUrl(referenceBuffer, referenceMimeType || "image/jpeg") } });
  }

  return content;
}

async function generateWithAvalai({
  content,
  outputPreset,
  model: selectedModel,
}: {
  content: string | ChatContentPart[];
  outputPreset?: string | null;
  model?: string | null;
}): Promise<GeneratedImageResult> {
  const { apiKey, baseURL, model, imageSize, aspectRatio } = getAvalaiConfig();
  const imageModel = selectedModel?.trim() || model;
  const imageAspectRatio = getAspectRatio(outputPreset, aspectRatio);

  try {
    return await withTransientRetry(async () => {
      const generated = await extractGeneratedImage(
        await postAvalaiJson<ChatCompletionImageResponse>({
          baseURL,
          apiKey,
          path: "/chat/completions",
          body: {
            model: imageModel,
            messages: [{ role: "user", content }],
            modalities: ["image", "text"],
            extra_body: {
              generationConfig: {
                imageConfig: {
                  aspectRatio: imageAspectRatio,
                  imageSize,
                },
              },
            },
          },
        }),
      );
      return { ...generated, model: imageModel };
    });
  } catch (error) {
    if (isRetryableProviderError(error)) {
      throw new AvalaiGenerationError("Avalai temporary network error after retries.", error);
    }

    if (error instanceof AvalaiGenerationError) {
      throw error;
    }

    throw new AvalaiGenerationError("Avalai image generation failed.", error);
  }
}

function appendResponseFormat(body: Record<string, unknown>, responseFormat: string | undefined) {
  if (responseFormat) {
    body.response_format = responseFormat;
  }

  return body;
}

async function generateTextWithOpenAIImageModel({
  prompt,
  stylePrompt,
  outputPreset,
  model: selectedModel,
}: GenerateTextImageInput): Promise<GeneratedImageResult> {
  const { apiKey, baseURL, model, openAIImageQuality, responseFormat } = getAvalaiConfig();
  const imageModel = selectedModel?.trim() || model;

  try {
    return await withTransientRetry(async () => {
      const generated = await extractGeneratedImageFromImagesResponse(
        await postAvalaiJson<ImagesResponse>({
          baseURL,
          apiKey,
          path: "/images/generations",
          body: appendResponseFormat(
            {
              model: imageModel,
              prompt: `${prompt}\n\n${stylePrompt}\n\nReturn one final premium studio product image suitable for e-commerce.`,
              size: getOpenAIImageSize(outputPreset),
              quality: openAIImageQuality,
              n: 1,
            },
            responseFormat,
          ),
        }),
      );
      return { ...generated, model: imageModel };
    });
  } catch (error) {
    if (isRetryableProviderError(error)) {
      throw new AvalaiGenerationError("Avalai temporary network error after retries.", error);
    }

    if (error instanceof AvalaiGenerationError) {
      throw error;
    }

    throw new AvalaiGenerationError("Avalai image generation failed.", error);
  }
}

async function generateStyledWithOpenAIImageModel({
  sourceBuffer,
  mimeType,
  supportingImages,
  referenceBuffer,
  referenceMimeType,
  stylePrompt,
  outputPreset,
  model: selectedModel,
}: GenerateImageInput): Promise<GeneratedImageResult> {
  const { apiKey, baseURL, model, openAIImageQuality, responseFormat } = getAvalaiConfig();
  const imageModel = selectedModel?.trim() || model;

  try {
    return await withTransientRetry(async () => {
      const form = new FormData();
      form.append("model", imageModel);
      form.append("prompt", `${stylePrompt}\n\n${generationPromptSuffix(Boolean(referenceBuffer))}`);
      form.append("size", getOpenAIImageSize(outputPreset));
      form.append("quality", openAIImageQuality);
      if (responseFormat) {
        form.append("response_format", responseFormat);
      }
      form.append("image", new Blob([new Uint8Array(sourceBuffer)], { type: mimeType }), `source.${extensionFromMimeType(mimeType)}`);

      for (const [index, supportingImage] of (supportingImages ?? []).entries()) {
        form.append(
          "image",
          new Blob([new Uint8Array(supportingImage.buffer)], { type: supportingImage.mimeType }),
          `supporting-${index + 1}.${extensionFromMimeType(supportingImage.mimeType)}`,
        );
      }

      if (referenceBuffer) {
        const safeReferenceMimeType = referenceMimeType || "image/jpeg";
        form.append(
          "image",
          new Blob([new Uint8Array(referenceBuffer)], { type: safeReferenceMimeType }),
          `reference.${extensionFromMimeType(safeReferenceMimeType)}`,
        );
      }

      const generated = await extractGeneratedImageFromImagesResponse(
        await postAvalaiForm<ImagesResponse>({
          baseURL,
          apiKey,
          path: "/images/edits",
          body: form,
        }),
      );
      return { ...generated, model: imageModel };
    });
  } catch (error) {
    if (isRetryableProviderError(error)) {
      throw new AvalaiGenerationError("Avalai temporary network error after retries.", error);
    }

    if (error instanceof AvalaiGenerationError) {
      throw error;
    }

    throw new AvalaiGenerationError("Avalai image generation failed.", error);
  }
}

export async function generateStyledImageWithAvalai({
  sourceBuffer,
  mimeType,
  supportingImages,
  referenceBuffer,
  referenceMimeType,
  stylePrompt,
  outputPreset,
  model,
}: GenerateImageInput) {
  if (isOpenAIImageModel(model?.trim() || avalaiModel())) {
    return generateStyledWithOpenAIImageModel({
      sourceBuffer,
      mimeType,
      supportingImages,
      referenceBuffer,
      referenceMimeType,
      stylePrompt,
      outputPreset,
      model,
    });
  }

  return generateWithAvalai({
    content: buildImageContent({
      sourceBuffer,
      mimeType,
      supportingImages,
      referenceBuffer,
      referenceMimeType,
      stylePrompt,
    }),
    outputPreset,
    model,
  });
}

export async function generateTextImageWithAvalai({ prompt, stylePrompt, outputPreset, model }: GenerateTextImageInput) {
  if (isOpenAIImageModel(model?.trim() || avalaiModel())) {
    return generateTextWithOpenAIImageModel({ prompt, stylePrompt, outputPreset, model });
  }

  return generateWithAvalai({
    content: `${prompt}\n\n${stylePrompt}\n\nReturn one final premium studio product image suitable for e-commerce.`,
    outputPreset,
    model,
  });
}
