import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { readStorageObject } from "@/lib/storage";

export type ImageThumbnailPreset = "tiny" | "card" | "preview";

type ThumbnailPresetConfig = {
  width: number;
  height?: number;
  fit: "cover" | "inside";
  quality: number;
  withoutEnlargement?: boolean;
};

export const IMAGE_THUMBNAIL_PRESETS: Record<ImageThumbnailPreset, ThumbnailPresetConfig> = {
  tiny: { width: 96, height: 96, fit: "cover", quality: 72 },
  card: { width: 640, height: 640, fit: "cover", quality: 78 },
  preview: { width: 1024, height: 1024, fit: "inside", quality: 82, withoutEnlargement: true },
};

export function isImageThumbnailPreset(value: string): value is ImageThumbnailPreset {
  return Object.prototype.hasOwnProperty.call(IMAGE_THUMBNAIL_PRESETS, value);
}

const thumbnailCacheRoot = path.join(process.cwd(), ".local-storage", "image-cache", "v1");
const inFlight = new Map<string, Promise<ThumbnailResult>>();
const generationWaiters: Array<() => void> = [];
let activeGenerations = 0;

export type ThumbnailResult = {
  buffer: Buffer;
  cacheStatus: "HIT" | "MISS";
  durationMs: number;
};

function cacheKey(storageKey: string) {
  return createHash("sha256").update(storageKey.replace(/\\/g, "/")).digest("hex");
}

function thumbnailCachePath(storageKey: string, preset: ImageThumbnailPreset) {
  return path.join(thumbnailCacheRoot, preset, `${cacheKey(storageKey)}.webp`);
}

async function readCachedThumbnail(storageKey: string, preset: ImageThumbnailPreset) {
  try {
    return await readFile(thumbnailCachePath(storageKey, preset));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return null;
  }
}

async function withGenerationSlot<T>(task: () => Promise<T>) {
  if (activeGenerations >= 1) {
    await new Promise<void>((resolve) => generationWaiters.push(resolve));
  }

  activeGenerations += 1;
  try {
    return await task();
  } finally {
    activeGenerations -= 1;
    generationWaiters.shift()?.();
  }
}

async function transformAndCache(storageKey: string, preset: ImageThumbnailPreset, originalBuffer: Buffer) {
  const config = IMAGE_THUMBNAIL_PRESETS[preset];
  const buffer = await sharp(originalBuffer, { failOn: "none" })
    .rotate()
    .resize({
      width: config.width,
      height: config.height,
      fit: config.fit,
      withoutEnlargement: config.withoutEnlargement,
    })
    .webp({ quality: config.quality, effort: 3 })
    .toBuffer();

  const targetPath = thumbnailCachePath(storageKey, preset);
  const temporaryPath = `${targetPath}.${randomUUID()}.tmp`;
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(temporaryPath, buffer);
  await rename(temporaryPath, targetPath);
  return buffer;
}

async function generateThumbnail(storageKey: string, preset: ImageThumbnailPreset): Promise<ThumbnailResult> {
  const startedAt = performance.now();
  const cached = await readCachedThumbnail(storageKey, preset);
  if (cached) return { buffer: cached, cacheStatus: "HIT", durationMs: performance.now() - startedAt };

  return withGenerationSlot(async () => {
    const cachedAfterWait = await readCachedThumbnail(storageKey, preset);
    if (cachedAfterWait) {
      return { buffer: cachedAfterWait, cacheStatus: "HIT", durationMs: performance.now() - startedAt };
    }

    const original = await readStorageObject(storageKey, "application/octet-stream");
    if (!original.mimeType.startsWith("image/")) throw new Error("Stored object is not a supported image.");

    const buffer = await transformAndCache(storageKey, preset, original.buffer);

    const durationMs = performance.now() - startedAt;
    if (durationMs >= 500) {
      console.warn("[image-thumbnail-slow]", { storageKey, preset, durationMs: Math.round(durationMs) });
    }
    return { buffer, cacheStatus: "MISS", durationMs };
  });
}

export async function getImageThumbnail(storageKey: string, preset: ImageThumbnailPreset) {
  const key = `${preset}:${storageKey.replace(/\\/g, "/")}`;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const pending = generateThumbnail(storageKey, preset).finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

export async function clearImageThumbnailCache(storageKey: string) {
  await Promise.all(
    (Object.keys(IMAGE_THUMBNAIL_PRESETS) as ImageThumbnailPreset[]).map((preset) =>
      unlink(thumbnailCachePath(storageKey, preset)).catch((error) => {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }),
    ),
  );
}

export async function warmImageThumbnails(storageKey: string, originalBuffer?: Buffer) {
  if (!originalBuffer) {
    await Promise.all(
      (Object.keys(IMAGE_THUMBNAIL_PRESETS) as ImageThumbnailPreset[]).map((preset) => getImageThumbnail(storageKey, preset)),
    );
    return;
  }

  for (const preset of Object.keys(IMAGE_THUMBNAIL_PRESETS) as ImageThumbnailPreset[]) {
    if (await readCachedThumbnail(storageKey, preset)) continue;
    await withGenerationSlot(() => transformAndCache(storageKey, preset, originalBuffer));
  }
}
