export type ImageProvider = "liara" | "avalai";

const DEFAULT_IMAGE_PROVIDER: ImageProvider = "avalai";

export function normalizeImageProvider(value: string | null | undefined): ImageProvider {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "avalai") {
    return "avalai";
  }

  if (normalized === "liara") {
    return "liara";
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
  requestId?: string | null;
};
