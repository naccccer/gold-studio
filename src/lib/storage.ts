import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";

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
};

function getStorageKind(): StorageKind {
  return process.env.STORAGE_DRIVER?.trim().toLowerCase() === S3_STORAGE_KIND ? S3_STORAGE_KIND : LOCAL_STORAGE_KIND;
}

function normalizeKey(key: string) {
  return key.split(path.sep).join("/");
}

function getLocalPublicUrl(key: string) {
  return `/${normalizeKey(key)}`;
}

function getLocalPublicPath(key: string) {
  const normalized = path.normalize(key);
  const uploadsRoot = `uploads${path.sep}`;

  if (normalized.startsWith("..") || path.isAbsolute(normalized) || !normalized.startsWith(uploadsRoot)) {
    throw new Error("مسیر فایل معتبر نیست.");
  }

  const relativeUploadsPath = normalized.slice(uploadsRoot.length);
  return path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads", relativeUploadsPath);
}

const localStorageAdapter: StorageAdapter = {
  kind: LOCAL_STORAGE_KIND,
  getPublicUrl: getLocalPublicUrl,
  async readObject(key, fallbackMimeType) {
    const buffer = await readFile(getLocalPublicPath(key));
    return { buffer, mimeType: fallbackMimeType };
  },
  async saveObject({ buffer, key }) {
    const targetPath = getLocalPublicPath(key);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);
    return getLocalPublicUrl(key);
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

function getS3PublicBaseUrl() {
  const value = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (!value) {
    throw new Error("S3_PUBLIC_BASE_URL env var is required when STORAGE_DRIVER=s3.");
  }
  return normalizeStorageUrl(value).replace(/\/+$/, "");
}

const s3StorageAdapter: StorageAdapter = {
  kind: S3_STORAGE_KIND,
  getPublicUrl(key) {
    return `${getS3PublicBaseUrl()}/${normalizeKey(key)}`;
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

    return `${getS3PublicBaseUrl()}/${normalizedKey}`;
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

export async function saveStorageObject(input: SaveObjectInput) {
  return getStorageAdapter().saveObject(input);
}

export async function readStorageObject(key: string, fallbackMimeType: string) {
  return getStorageAdapter().readObject(key, fallbackMimeType);
}
