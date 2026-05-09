import OpenAI, { toFile } from "openai";
import type { ImageEditParams, ImageGenerateParams, ImagesResponse } from "openai/resources/images";
import sharp from "sharp";

const DEFAULT_LIARA_BASE_URL = "https://ai.liara.ir/api/69fe30c50bb427e049d327f6/v1";
const DEFAULT_LIARA_IMAGE_MODEL = "google/gemini-2.5-flash-image";
const DEFAULT_IMAGE_SIZE = "2048x2048";
const DEFAULT_IMAGE_QUALITY = "2K";
const DEFAULT_FALLBACK_LONG_EDGE = 2048;
const SUPPORTED_IMAGE_QUALITIES = new Set(["1K", "2K", "4K"]);
const TRANSIENT_RETRY_DELAYS_MS = [1500, 4000, 9000];
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_NETWORK_PATTERNS = [
  "client network socket disconnected before secure tls connection was established",
  "econnreset",
  "etimedout",
  "eai_again",
  "enotfound",
  "und_err_socket",
  "und_err_connect_timeout",
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
};

type GenerateTextImageInput = {
  prompt: string;
  stylePrompt: string;
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

let cachedClient: OpenAI | null = null;

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
    fallbackLongEdge: Number.parseInt(readEnv("LIARA_FALLBACK_LONG_EDGE", ["GAPGPT_OUTPUT_MIN_SIZE"]) || "", 10),
    allowUpscaleFallback: readEnv("LIARA_ALLOW_UPSCALE_FALLBACK") === "true",
  };
}

function getLiaraClient(apiKey: string, baseURL: string) {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey, baseURL, maxRetries: 0 });
  }

  return cachedClient;
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function getImageSize(size: string): NonNullable<ImageEditParams["size"] & ImageGenerateParams["size"]> {
  return size as NonNullable<ImageEditParams["size"] & ImageGenerateParams["size"]>;
}

function getImageQuality(quality: string) {
  if (SUPPORTED_IMAGE_QUALITIES.has(quality)) {
    return quality;
  }

  return DEFAULT_IMAGE_QUALITY;
}

function getProviderImageQuality(quality: string): NonNullable<ImageEditParams["quality"] & ImageGenerateParams["quality"]> {
  return getImageQuality(quality) as NonNullable<ImageEditParams["quality"] & ImageGenerateParams["quality"]>;
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

function parseImageSize(size: string) {
  const match = size.match(/^(\d+)x(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    width: Number.parseInt(match[1], 10),
    height: Number.parseInt(match[2], 10),
  };
}

function getCompatibleFallbackSize(size: string) {
  const parsedSize = parseImageSize(size);
  if (!parsedSize || parsedSize.width === parsedSize.height) {
    return "1024x1024";
  }

  return parsedSize.width > parsedSize.height ? "1536x1024" : "1024x1536";
}

function isUnsupportedSizeError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as {
    status?: unknown;
    message?: unknown;
    error?: { message?: unknown; param?: unknown; code?: unknown };
    param?: unknown;
    code?: unknown;
  };
  const status = typeof maybeError.status === "number" ? maybeError.status : null;
  const message = `${typeof maybeError.message === "string" ? maybeError.message : ""} ${
    typeof maybeError.error?.message === "string" ? maybeError.error.message : ""
  } ${typeof maybeError.param === "string" ? maybeError.param : ""} ${
    typeof maybeError.error?.param === "string" ? maybeError.error.param : ""
  } ${typeof maybeError.code === "string" ? maybeError.code : ""} ${
    typeof maybeError.error?.code === "string" ? maybeError.error.code : ""
  }`.toLowerCase();

  return (
    (status === 400 || status === 422) &&
    (message.includes("size") ||
      message.includes("dimension") ||
      message.includes("resolution") ||
      message.includes("unsupported") ||
      message.includes("invalid"))
  );
}

function isUnsupportedEditOptionError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as {
    status?: unknown;
    message?: unknown;
    error?: { message?: unknown; param?: unknown };
    param?: unknown;
  };
  const status = typeof maybeError.status === "number" ? maybeError.status : null;
  const message = `${typeof maybeError.message === "string" ? maybeError.message : ""} ${
    typeof maybeError.error?.message === "string" ? maybeError.error.message : ""
  } ${typeof maybeError.param === "string" ? maybeError.param : ""} ${
    typeof maybeError.error?.param === "string" ? maybeError.error.param : ""
  }`.toLowerCase();

  return (
    (status === 400 || status === 422) &&
    (message.includes("size") ||
      message.includes("quality") ||
      message.includes("unsupported") ||
      message.includes("invalid") ||
      message.includes("unknown") ||
      message.includes("unrecognized"))
  );
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

async function upscaleToLongEdge(imageBuffer: Buffer, longEdge: number): Promise<Buffer> {
  const targetSize = Number.isFinite(longEdge) && longEdge > 0 ? longEdge : DEFAULT_FALLBACK_LONG_EDGE;
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height || Math.max(metadata.width, metadata.height) >= targetSize) {
    return image.png().toBuffer();
  }

  const scale = targetSize / Math.max(metadata.width, metadata.height);

  return image
    .resize({
      width: Math.ceil(metadata.width * scale),
      height: Math.ceil(metadata.height * scale),
      fit: "fill",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
}

async function generateWithFallback(
  size: string,
  fallbackLongEdge: number,
  allowUpscaleFallback: boolean,
  generate: (requestSize: string) => Promise<ImagesResponse>,
) {
  try {
    return await extractGeneratedImage(await generate(size));
  } catch (error) {
    if (!allowUpscaleFallback || !isUnsupportedSizeError(error)) {
      throw error;
    }

    const fallbackSize = getCompatibleFallbackSize(size);
    const generatedImage = await extractGeneratedImage(await generate(fallbackSize));
    return {
      imageBuffer: await upscaleToLongEdge(generatedImage.imageBuffer, fallbackLongEdge),
      mimeType: "image/png",
    };
  }
}

async function editWithLiaraFallback({
  client,
  model,
  image,
  prompt,
  size,
  quality,
  fallbackLongEdge,
  allowUpscaleFallback,
}: {
  client: OpenAI;
  model: string;
  image: Awaited<ReturnType<typeof toFile>>;
  prompt: string;
  size: string;
  quality: string;
  fallbackLongEdge: number;
  allowUpscaleFallback: boolean;
}) {
  try {
    return await extractGeneratedImage(
      await client.images.edit({
        model,
        image: [image],
        prompt,
        size: getImageSize(size),
        quality: getProviderImageQuality(quality),
      }),
    );
  } catch (nativeError) {
    if (!allowUpscaleFallback || !isUnsupportedEditOptionError(nativeError)) {
      throw nativeError;
    }

    try {
      const fallbackSize = getCompatibleFallbackSize(size);
      const generatedImage = await extractGeneratedImage(
        await client.images.edit({
          model,
          image: [image],
          prompt,
          size: getImageSize(fallbackSize),
          quality: getProviderImageQuality(quality),
        }),
      );

      return {
        imageBuffer: await upscaleToLongEdge(generatedImage.imageBuffer, fallbackLongEdge),
        mimeType: "image/png",
      };
    } catch (fallbackError) {
      if (!isUnsupportedEditOptionError(fallbackError)) {
        throw fallbackError;
      }

      const generatedImage = await extractGeneratedImage(
        await client.images.edit({
          model,
          image: [image],
          prompt,
        }),
      );

      return {
        imageBuffer: await upscaleToLongEdge(generatedImage.imageBuffer, fallbackLongEdge),
        mimeType: "image/png",
      };
    }
  }
}

export async function generateStyledImageWithLiara({
  sourceBuffer,
  mimeType,
  stylePrompt,
}: GenerateImageInput): Promise<LiaraImageResult> {
  const { apiKey, baseURL, model, size, quality, fallbackLongEdge, allowUpscaleFallback } = getLiaraConfig();
  const client = getLiaraClient(apiKey, baseURL);
  const image = await toFile(sourceBuffer, `source.${extensionFromMimeType(mimeType)}`, { type: mimeType });

  try {
    return await withTransientRetry(() =>
      editWithLiaraFallback({
        client,
        model,
        image,
        prompt: `${stylePrompt}\n\n${GENERATION_PROMPT_SUFFIX}`,
        size,
        quality,
        fallbackLongEdge,
        allowUpscaleFallback,
      }),
    );
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
}: GenerateTextImageInput): Promise<LiaraImageResult> {
  const { apiKey, baseURL, model, size, quality, fallbackLongEdge, allowUpscaleFallback } = getLiaraConfig();
  const client = getLiaraClient(apiKey, baseURL);

  try {
    return await withTransientRetry(() =>
      generateWithFallback(size, fallbackLongEdge, allowUpscaleFallback, (requestSize) =>
        client.images.generate({
          model,
          prompt: `${prompt}\n\n${stylePrompt}\n\nReturn one final premium studio product image suitable for e-commerce.`,
          size: getImageSize(requestSize),
          quality: getProviderImageQuality(quality),
          n: 1,
        }),
      ),
    );
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
