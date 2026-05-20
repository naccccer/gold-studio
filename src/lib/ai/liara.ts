import type { ImagesResponse } from "openai/resources/images";
import { getOutputPresetSpec } from "@/lib/output-presets";

const DEFAULT_LIARA_BASE_URL = "https://ai.liara.ir/api/69fe30c50bb427e049d327f6/v1";
const DEFAULT_LIARA_IMAGE_MODEL = "google/gemini-3-pro-image-preview";
const DEFAULT_IMAGE_SIZE = "1024x1024";
const DEFAULT_IMAGE_QUALITY = "2K";
const SUPPORTED_IMAGE_QUALITIES = new Set(["1K", "2K", "4K"]);
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
  "The input product is the strict identity reference. Preserve the exact product shape, proportions, silhouette, metal color, gemstone count and placement, chain or clasp design, watch face, engravings, material finish, and all visible jewelry details.",
  "Do not redesign, simplify, add, remove, replace, resize, recolor, or hallucinate product parts.",
  "Make the image look like a real high-end studio photograph with natural optics, believable lighting, realistic reflections, and true material texture.",
  "Avoid AI-looking gloss, CGI, 3D render, plastic surfaces, over-smoothing, over-sharpening, artificial sparkle, surreal lighting, distorted geometry, and fake luxury effects.",
].join("\n");

type GenerateImageInput = {
  sourceBuffer: Buffer;
  mimeType: string;
  stylePrompt: string;
  outputPreset?: string | null;
};

type GenerateTextImageInput = {
  prompt: string;
  stylePrompt: string;
  outputPreset?: string | null;
};

export type LiaraImageResult = {
  imageBuffer: Buffer;
  mimeType: string;
};

class LiaraGenerationError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LiaraGenerationError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

function readEnv(primaryName: string, fallbackNames: string[] = []) {
  const names = [primaryName, ...fallbackNames];
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function getLiaraConfig() {
  const liaraApiKey = readEnv("LIARA_API_KEY", ["liara_API_KEY"]);
  const apiKey = liaraApiKey || readEnv("GAPGPT_API_KEY");
  if (!apiKey) {
    throw new LiaraGenerationError("LIARA_API_KEY env var is required.");
  }

  return {
    apiKey,
    baseURL:
      (liaraApiKey ? readEnv("LIARA_BASE_URL") : readEnv("LIARA_BASE_URL", ["GAPGPT_BASE_URL"])) ||
      DEFAULT_LIARA_BASE_URL,
    model:
      (liaraApiKey ? readEnv("LIARA_IMAGE_MODEL") : readEnv("LIARA_IMAGE_MODEL", ["GAPGPT_IMAGE_MODEL"])) ||
      DEFAULT_LIARA_IMAGE_MODEL,
    size: (liaraApiKey ? readEnv("LIARA_IMAGE_SIZE") : readEnv("LIARA_IMAGE_SIZE", ["GAPGPT_IMAGE_SIZE"])) || DEFAULT_IMAGE_SIZE,
    quality: readEnv("LIARA_IMAGE_QUALITY", ["GAPGPT_IMAGE_QUALITY"]) || DEFAULT_IMAGE_QUALITY,
  };
}

export function liaraModel() {
  return process.env.LIARA_IMAGE_MODEL?.trim() || process.env.GAPGPT_IMAGE_MODEL?.trim() || DEFAULT_LIARA_IMAGE_MODEL;
}

function getImageQuality(quality: string) {
  if (SUPPORTED_IMAGE_QUALITIES.has(quality)) {
    return quality;
  }

  return DEFAULT_IMAGE_QUALITY;
}

function getImageSize(outputPreset: string | null | undefined, configuredSize: string) {
  return outputPreset ? getOutputPresetSpec(outputPreset).providerSize : configuredSize;
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new LiaraGenerationError(`Liara image download failed with status ${response.status}.`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/png";
  return {
    imageBuffer: Buffer.from(await response.arrayBuffer()),
    mimeType,
  };
}

async function extractGeneratedImage(response: ImagesResponse) {
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

  throw new LiaraGenerationError("Liara did not return an image.");
}

async function postLiaraJson<T>({
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
  const response = await fetch(`${baseURL.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }

    throw new LiaraGenerationError(`Liara request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`);
  }

  return (await response.json()) as T;
}

async function postLiaraForm<T>({
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
  const response = await fetch(`${baseURL.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }

    throw new LiaraGenerationError(`Liara request failed with status ${response.status}${detail ? `: ${detail}` : ""}.`);
  }

  return (await response.json()) as T;
}

function getProviderErrorDetail(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const maybeError = error as {
    status?: unknown;
    message?: unknown;
    error?: { message?: unknown; param?: unknown; code?: unknown };
    param?: unknown;
    code?: unknown;
  };
  const details = [
    typeof maybeError.status === "number" ? `status ${maybeError.status}` : null,
    typeof maybeError.message === "string" ? maybeError.message : null,
    typeof maybeError.error?.message === "string" ? maybeError.error.message : null,
    typeof maybeError.param === "string" ? `param ${maybeError.param}` : null,
    typeof maybeError.error?.param === "string" ? `param ${maybeError.error.param}` : null,
    typeof maybeError.code === "string" ? `code ${maybeError.code}` : null,
    typeof maybeError.error?.code === "string" ? `code ${maybeError.error.code}` : null,
  ].filter(Boolean);

  return details.length > 0 ? Array.from(new Set(details)).join("; ") : null;
}

export async function generateStyledImageWithLiara({
  sourceBuffer,
  mimeType,
  stylePrompt,
  outputPreset,
}: GenerateImageInput): Promise<LiaraImageResult> {
  const { apiKey, baseURL, model, quality, size } = getLiaraConfig();
  const imageSize = getImageSize(outputPreset, size);

  try {
    return await withTransientRetry(async () => {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", `${stylePrompt}\n\n${GENERATION_PROMPT_SUFFIX}`);
      form.append("size", imageSize);
      form.append("quality", getImageQuality(quality));
      form.append("image", new Blob([new Uint8Array(sourceBuffer)], { type: mimeType }), `source.${extensionFromMimeType(mimeType)}`);

      return extractGeneratedImage(
        await postLiaraForm<ImagesResponse>({
          baseURL,
          apiKey,
          path: "/images/edits",
          body: form,
        }),
      );
    });
  } catch (error) {
    if (isRetryableProviderError(error)) {
      throw new LiaraGenerationError("Liara temporary network error after retries.", error);
    }

    if (error instanceof LiaraGenerationError) {
      throw error;
    }

    const providerDetail = getProviderErrorDetail(error);
    throw new LiaraGenerationError(
      providerDetail
        ? `Liara image-to-image generation failed: ${providerDetail}`
        : "Liara image-to-image generation failed. Confirm Liara supports OpenAI-compatible images.edit for the selected Gemini image model.",
      error,
    );
  }
}

export async function generateTextImageWithLiara({
  prompt,
  stylePrompt,
  outputPreset,
}: GenerateTextImageInput): Promise<LiaraImageResult> {
  const { apiKey, baseURL, model, quality, size } = getLiaraConfig();
  const imageSize = getImageSize(outputPreset, size);

  try {
    return await withTransientRetry(async () => {
      return extractGeneratedImage(
        await postLiaraJson<ImagesResponse>({
          baseURL,
          apiKey,
          path: "/images/generations",
          body: {
            model,
            prompt: `${prompt}\n\n${stylePrompt}\n\nReturn one final premium studio product image suitable for e-commerce.`,
            size: imageSize,
            quality: getImageQuality(quality),
            n: 1,
          },
        }),
      );
    });
  } catch (error) {
    if (isRetryableProviderError(error)) {
      throw new LiaraGenerationError("Liara temporary network error after retries.", error);
    }

    if (error instanceof LiaraGenerationError) {
      throw error;
    }

    const providerDetail = getProviderErrorDetail(error);
    throw new LiaraGenerationError(
      providerDetail ? `Liara text-to-image generation failed: ${providerDetail}` : "Liara text-to-image generation failed.",
      error,
    );
  }
}
