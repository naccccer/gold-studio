export type ImageProvider = "liara" | "avalai";

const DEFAULT_IMAGE_PROVIDER: ImageProvider = "liara";

export function normalizeImageProvider(value: string | null | undefined): ImageProvider {
  if (value?.trim().toLowerCase() === "avalai") {
    return "avalai";
  }

  return DEFAULT_IMAGE_PROVIDER;
}

export function imageProvider(): ImageProvider {
  return normalizeImageProvider(
    process.env.IMAGE_PROVIDER || process.env.AI_IMAGE_PROVIDER || process.env.IMAGE_GENERATION_PROVIDER,
  );
}

export function imageProviderLabel(provider: ImageProvider = imageProvider()) {
  return provider === "avalai" ? "Avalai" : "Liara";
}

export type GeneratedImageResult = {
  imageBuffer: Buffer;
  mimeType: string;
  model: string;
};
