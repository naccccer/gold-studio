import { getOutputPresetSpec } from "@/lib/output-presets";
import { assertTwoKImageDimensions } from "@/lib/ai/image-resolution";
import { clampNon4KImageSetting } from "@/lib/ai/model-routing";
import { buildGenerationPromptSuffix } from "@/lib/ai/vertical-prompt-rules";
import type { GeneratedImageResult } from "@/lib/ai/provider";
import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

const DEFAULT_AVALAI_BASE_URL = "https://api.avalai.ir/v1";
const DEFAULT_AVALAI_IMAGE_MODEL = "gemini-3.1-flash-image";
const DEFAULT_AVALAI_IMAGE_SIZE = "2K";
const DEFAULT_OPENAI_IMAGE_SIZE = "2048x2048";
const DEFAULT_REQUEST_TIMEOUT_MS = 300000;
const DEFAULT_GEMINI_REQUEST_TIMEOUT_MS = 60000;
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
  vertical?: VerticalId;
};

type GenerateTextImageInput = {
  prompt: string;
  stylePrompt: string;
  outputPreset?: string | null;
  model?: string | null;
  vertical?: VerticalId;
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

type GeminiPart = {
  text?: string;
  inlineData?: {
    data?: string;
    mimeType?: string;
  };
  inline_data?: {
    data?: string;
    mime_type?: string;
  };
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
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

function getGeminiRequestTimeoutMs() {
  const configured = Number.parseInt(process.env.AVALAI_GEMINI_IMAGE_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(configured) && configured >= 10000 ? configured : DEFAULT_GEMINI_REQUEST_TIMEOUT_MS;
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

function isGemini31FlashImageModel(model: string) {
  return model === "gemini-3.1-flash-image" || model === "gemini-3.1-flash-image-preview";
}

function getOpenAIImageSize(outputPreset: string | null | undefined) {
  if (outputPreset === "story") return "1536x2752";
  if (outputPreset === "banner") return "2752x1536";
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

function generationPromptSuffix(vertical: VerticalId, hasReferenceScene: boolean) {
  return buildGenerationPromptSuffix(vertical, hasReferenceScene);
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

function dataUrlToGeminiInlineData(url: string) {
  const match = url.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    throw new AvalaiGenerationError("Gemini native image input must be a base64 data URL.");
  }

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

function toGeminiParts(content: string | ChatContentPart[]): GeminiPart[] {
  if (typeof content === "string") {
    return [{ text: content }];
  }

  return content.map((part) =>
    part.type === "text" ? { text: part.text } : dataUrlToGeminiInlineData(part.image_url.url),
  );
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

async function withRequestTimeout<T>(
  label: string,
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = getRequestTimeoutMs(),
) {
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

async function extractGeneratedImageFromGeminiResponse(response: GeminiGenerateContentResponse) {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data || part.inline_data?.data);
  const data = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
  const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || "image/png";

  if (!data) {
    throw new AvalaiGenerationError("Avalai Gemini native API did not return an image.");
  }

  return {
    imageBuffer: Buffer.from(data, "base64"),
    mimeType,
  };
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

function avalaiNativeBaseURL(baseURL: string) {
  return baseURL.replace(/\/$/, "").replace(/\/v1$/, "");
}

async function postAvalaiGeminiNative<T>({
  baseURL,
  apiKey,
  model,
  body,
}: {
  baseURL: string;
  apiKey: string;
  model: string;
  body: unknown;
}) {
  const response = await withRequestTimeout("Avalai Gemini native request", (signal) =>
    fetch(`${avalaiNativeBaseURL(baseURL)}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    }),
    getGeminiRequestTimeoutMs(),
  );

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }

    throw new AvalaiGenerationError(
      `Avalai Gemini native request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`,
    );
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
  vertical = DEFAULT_VERTICAL_ID,
}: Omit<GenerateImageInput, "outputPreset" | "model">): ChatContentPart[] {
  const content: ChatContentPart[] = [
    { type: "text", text: `${stylePrompt}\n\n${generationPromptSuffix(vertical, Boolean(referenceBuffer))}` },
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
      text:
        vertical === "food"
          ? "Sample scene reference. This image is scene and composition only, not item identity. Keep its non-item scene recognizable, including table, plate, cup, glassware, wrapper, surface, props, lighting, shadows, reflections, camera angle, lens feel, crop, and freshness cues when present. Replace the sample food, drink, plate, cup, package, or menu item with the core item identity from the primary item reference, allowing controlled advertising polish without changing the menu item, flavor, brand, or SKU. Do not copy or retain the sample item identity."
          : "Sample scene reference. This image is scene and composition only, not product identity. Keep its non-product scene recognizable, including hand, wrist, fingers, skin, water, surface, props, lighting, shadows, reflections, camera angle, lens feel, crop, and pose when present. Replace only the sample product/jewelry/accessory with the uploaded product identity from the primary product reference. Do not copy or retain the sample product identity.",
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
      const generated = isGemini31FlashImageModel(imageModel)
        ? await extractGeneratedImageFromGeminiResponse(
            await postAvalaiGeminiNative<GeminiGenerateContentResponse>({
              baseURL,
              apiKey,
              model: imageModel,
              body: {
                contents: [{ role: "user", parts: toGeminiParts(content) }],
                generationConfig: {
                  responseModalities: ["TEXT", "IMAGE"],
                  imageConfig: {
                    aspectRatio: imageAspectRatio,
                    imageSize,
                  },
                },
              },
            }),
          )
        : await extractGeneratedImage(
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
      await assertTwoKImageDimensions({
        imageBuffer: generated.imageBuffer,
        imageSize,
        aspectRatio: imageAspectRatio,
        model: imageModel,
        makeError: (message) => new AvalaiGenerationError(message),
      });
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
  vertical = DEFAULT_VERTICAL_ID,
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
              prompt: `${prompt}\n\n${stylePrompt}\n\n${generationPromptSuffix(vertical, false)}`,
              size: getOpenAIImageSize(outputPreset),
              quality: openAIImageQuality,
              n: 1,
            },
            responseFormat,
          ),
        }),
      );
      await assertTwoKImageDimensions({
        imageBuffer: generated.imageBuffer,
        imageSize: "2K",
        aspectRatio: getAspectRatio(outputPreset, "1:1"),
        model: imageModel,
        makeError: (message) => new AvalaiGenerationError(message),
      });
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
  vertical = DEFAULT_VERTICAL_ID,
}: GenerateImageInput): Promise<GeneratedImageResult> {
  const { apiKey, baseURL, model, openAIImageQuality, responseFormat } = getAvalaiConfig();
  const imageModel = selectedModel?.trim() || model;

  try {
    return await withTransientRetry(async () => {
      const form = new FormData();
      form.append("model", imageModel);
      form.append("prompt", `${stylePrompt}\n\n${generationPromptSuffix(vertical, Boolean(referenceBuffer))}`);
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
      await assertTwoKImageDimensions({
        imageBuffer: generated.imageBuffer,
        imageSize: "2K",
        aspectRatio: getAspectRatio(outputPreset, "1:1"),
        model: imageModel,
        makeError: (message) => new AvalaiGenerationError(message),
      });
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
  vertical = DEFAULT_VERTICAL_ID,
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
      vertical,
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
      vertical,
    }),
    outputPreset,
    model,
  });
}

export async function generateTextImageWithAvalai({ prompt, stylePrompt, outputPreset, model, vertical = DEFAULT_VERTICAL_ID }: GenerateTextImageInput) {
  if (isOpenAIImageModel(model?.trim() || avalaiModel())) {
    return generateTextWithOpenAIImageModel({ prompt, stylePrompt, outputPreset, model, vertical });
  }

  return generateWithAvalai({
    content: `${prompt}\n\n${stylePrompt}\n\n${generationPromptSuffix(vertical, false)}`,
    outputPreset,
    model,
  });
}
