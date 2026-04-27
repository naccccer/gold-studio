import OpenAI, { toFile } from "openai";
import type { ImageEditParams, ImageGenerateParams, ImagesResponse } from "openai/resources/images";

const DEFAULT_GAPGPT_BASE_URL = "https://api.gapgpt.app/v1";
const DEFAULT_GAPGPT_IMAGE_MODEL = "gemini-3.1-flash-image-preview";
const DEFAULT_IMAGE_SIZE = "1024x1024";
const SUPPORTED_IMAGE_SIZES = new Set(["256x256", "512x512", "1024x1024", "1536x1024", "1024x1536", "auto"]);
const GENERATION_PROMPT_SUFFIX =
  "Return one final premium studio product image. Preserve the exact product identity, shape, material, and jewelry details from the input image.";

type GenerateImageInput = {
  sourceBuffer: Buffer;
  mimeType: string;
  stylePrompt: string;
};

type GenerateTextImageInput = {
  prompt: string;
  stylePrompt: string;
};

export type GapGptImageResult = {
  imageBuffer: Buffer;
  mimeType: string;
};

class GapGptGenerationError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "GapGptGenerationError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

let cachedClient: OpenAI | null = null;

function getGapGptConfig() {
  const apiKey = process.env.GAPGPT_API_KEY?.trim();
  if (!apiKey) {
    throw new GapGptGenerationError("GAPGPT_API_KEY env var is required.");
  }

  return {
    apiKey,
    baseURL: process.env.GAPGPT_BASE_URL?.trim() || DEFAULT_GAPGPT_BASE_URL,
    model: process.env.GAPGPT_IMAGE_MODEL?.trim() || DEFAULT_GAPGPT_IMAGE_MODEL,
    size: process.env.GAPGPT_IMAGE_SIZE?.trim() || DEFAULT_IMAGE_SIZE,
  };
}

function getGapGptClient(apiKey: string, baseURL: string) {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey, baseURL });
  }

  return cachedClient;
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function getImageSize(size: string): NonNullable<ImageEditParams["size"] & ImageGenerateParams["size"]> {
  if (SUPPORTED_IMAGE_SIZES.has(size)) {
    return size as NonNullable<ImageEditParams["size"] & ImageGenerateParams["size"]>;
  }

  return DEFAULT_IMAGE_SIZE;
}

async function fetchGeneratedImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new GapGptGenerationError(`GapGPT image download failed with status ${response.status}.`);
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

  throw new GapGptGenerationError("GapGPT did not return an image.");
}

export async function generateStyledImageWithGapGpt({
  sourceBuffer,
  mimeType,
  stylePrompt,
}: GenerateImageInput): Promise<GapGptImageResult> {
  const { apiKey, baseURL, model, size } = getGapGptConfig();
  const client = getGapGptClient(apiKey, baseURL);
  const image = await toFile(sourceBuffer, `source.${extensionFromMimeType(mimeType)}`, { type: mimeType });

  try {
    const response = await client.images.edit({
      model,
      image,
      prompt: `${stylePrompt}\n\n${GENERATION_PROMPT_SUFFIX}`,
      size: getImageSize(size),
    });

    return extractGeneratedImage(response);
  } catch (error) {
    if (error instanceof GapGptGenerationError) {
      throw error;
    }

    throw new GapGptGenerationError(
      "GapGPT image-to-image generation failed. Confirm GapGPT supports OpenAI-compatible images.edit for the selected Gemini image model.",
      error,
    );
  }
}

export async function generateTextImageWithGapGpt({
  prompt,
  stylePrompt,
}: GenerateTextImageInput): Promise<GapGptImageResult> {
  const { apiKey, baseURL, model, size } = getGapGptConfig();
  const client = getGapGptClient(apiKey, baseURL);

  try {
    const response = await client.images.generate({
      model,
      prompt: `${prompt}\n\n${stylePrompt}\n\nReturn one final premium studio product image suitable for e-commerce.`,
      size: getImageSize(size),
      n: 1,
    });

    return extractGeneratedImage(response);
  } catch (error) {
    if (error instanceof GapGptGenerationError) {
      throw error;
    }

    throw new GapGptGenerationError("GapGPT text-to-image generation failed.", error);
  }
}
