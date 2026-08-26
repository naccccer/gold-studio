import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";

const LOCAL_STORAGE_KIND = "local";
const S3_STORAGE_KIND = "s3";

type StorageKind = typeof LOCAL_STORAGE_KIND | typeof S3_STORAGE_KIND;

type StoredObject = {
  buffer: Buffer;
  mimeType: string;
};

type SaveObjectInput = {
  buffer: Buffer;
  contentType: string;
  key: string;
};

type StorageAdapter = {
  kind: StorageKind;
  getPublicUrl: (key: string) => string;
  readObject: (key: string, fallbackMimeType: string) => Promise<StoredObject>;
  saveObject: (input: SaveObjectInput) => Promise<string>;
  deleteObject: (key: string) => Promise<void>;
};

function getStorageKind(): StorageKind {
  return process.env.STORAGE_DRIVER?.trim().toLowerCase() === S3_STORAGE_KIND ? S3_STORAGE_KIND : LOCAL_STORAGE_KIND;
}

function normalizeKey(key: string) {
  return key.split(path.sep).join("/");
}

function getLocalPublicUrl(key: string) {
  return `/api/storage/${normalizeKey(key)}`;
}

function mimeTypeFromStorageKey(key: string) {
  const extension = path.extname(key).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".svg") return "image/svg+xml";
  return null;
}

function getRelativeUploadsPath(key: string) {
  const normalized = path.normalize(key);
  const uploadsRoot = `uploads${path.sep}`;

  if (normalized.startsWith("..") || path.isAbsolute(normalized) || !normalized.startsWith(uploadsRoot)) {
    throw new Error("مسیر فایل معتبر نیست.");
  }

  return normalized.slice(uploadsRoot.length);
}

function getLocalPrivatePath(key: string) {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), ".local-storage", "uploads", getRelativeUploadsPath(key));
}

const localStorageAdapter: StorageAdapter = {
  kind: LOCAL_STORAGE_KIND,
  getPublicUrl: getLocalPublicUrl,
  async readObject(key, fallbackMimeType) {
    const buffer = await readFile(getLocalPrivatePath(key));
    return { buffer, mimeType: mimeTypeFromStorageKey(key) || fallbackMimeType };
  },
  async saveObject({ buffer, key }) {
    const targetPath = getLocalPrivatePath(key);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);
    return getLocalPublicUrl(key);
  },
  async deleteObject(key) {
    try {
      await unlink(getLocalPrivatePath(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  },
};

let s3Client: S3Client | null = null;

function requiredStorageEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} env var is required when STORAGE_DRIVER=s3.`);
  }
  return value;
}

function normalizeStorageUrl(value: string) {
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function getS3Client() {
  if (s3Client) {
    return s3Client;
  }

  const config: S3ClientConfig = {
    region: requiredStorageEnv("S3_REGION"),
    endpoint: normalizeStorageUrl(requiredStorageEnv("S3_ENDPOINT")),
    credentials: {
      accessKeyId: requiredStorageEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredStorageEnv("S3_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE?.trim() === "true",
  };

  s3Client = new S3Client(config);
  return s3Client;
}

function getS3Bucket() {
  return requiredStorageEnv("S3_BUCKET");
}

const s3StorageAdapter: StorageAdapter = {
  kind: S3_STORAGE_KIND,
  getPublicUrl(key) {
    return `/api/storage/${normalizeKey(key)}`;
  },
  async readObject(key, fallbackMimeType) {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: normalizeKey(key),
      }),
    );

    if (!response.Body) {
      throw new Error("فایل ذخیره‌شده پیدا نشد.");
    }

    const bytes = await response.Body.transformToByteArray();
    return {
      buffer: Buffer.from(bytes),
      mimeType: response.ContentType?.trim() || fallbackMimeType,
    };
  },
  async saveObject({ buffer, contentType, key }) {
    const normalizedKey = normalizeKey(key);
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: getS3Bucket(),
        Key: normalizedKey,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return this.getPublicUrl(normalizedKey);
  },
  async deleteObject(key) {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getS3Bucket(),
        Key: normalizeKey(key),
      }),
    );
  },
};

function getStorageAdapter() {
  return getStorageKind() === S3_STORAGE_KIND ? s3StorageAdapter : localStorageAdapter;
}

export function buildStorageKey(directory: string, extension: string) {
  return path.join(directory, `${randomUUID()}.${extension}`);
}

export function storagePublicUrl(key: string) {
  return getStorageAdapter().getPublicUrl(key);
}

export type ImageThumbnailPreset = "tiny" | "card" | "preview";

export function storageThumbnailUrl(key: string, preset: ImageThumbnailPreset) {
  const normalizedKey = normalizeKey(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/api/storage/thumbnail/${preset}/${normalizedKey}`;
}

export function storageKeyFromUrl(value?: string | null) {
  if (!value?.startsWith("/api/storage/")) return null;
  const key = value.slice("/api/storage/".length);
  if (!key || key.startsWith("thumbnail/")) return null;
  try {
    return decodeURIComponent(key);
  } catch {
    return null;
  }
}

export function storageThumbnailUrlFromKeyOrUrl(
  storageKey: string | null | undefined,
  currentUrl: string | null | undefined,
  preset: ImageThumbnailPreset,
) {
  const key = storageKey || storageKeyFromUrl(currentUrl);
  return key ? storageThumbnailUrl(key, preset) : currentUrl ?? null;
}

export function storageUrlFromKeyOrUrl(storageKey?: string | null, currentUrl?: string | null) {
  if (storageKey) {
    return storagePublicUrl(storageKey);
  }

  if (currentUrl?.startsWith("/uploads/")) {
    return null;
  }

  return currentUrl ?? null;
}

export function isAllowedStorageKey(key: string) {
  const normalized = normalizeKey(key);
  return normalized.startsWith("uploads/") && !normalized.includes("../") && !normalized.startsWith("/");
}

export function isPublicStorageKey(key: string) {
  const normalized = normalizeKey(key);
  return normalized.startsWith("uploads/style-previews/") || normalized.startsWith("uploads/home-carousel/");
}

export async function saveStorageObject(input: SaveObjectInput) {
  const publicUrl = await getStorageAdapter().saveObject(input);
  if (input.contentType.startsWith("image/")) {
    setImmediate(() => {
      void import("@/lib/image-thumbnails")
        .then(({ warmImageThumbnails }) => warmImageThumbnails(input.key, input.buffer))
        .catch((error) => console.error("[image-thumbnail-warmup-failed]", { storageKey: input.key, error }));
    });
  }
  return publicUrl;
}

export async function readStorageObject(key: string, fallbackMimeType: string) {
  return getStorageAdapter().readObject(key, fallbackMimeType);
}

export async function deleteStorageObject(key: string) {
  await getStorageAdapter().deleteObject(key);
  await import("@/lib/image-thumbnails")
    .then(({ clearImageThumbnailCache }) => clearImageThumbnailCache(key))
    .catch((error) => console.error("[image-thumbnail-cache-delete-failed]", { storageKey: key, error }));
}
