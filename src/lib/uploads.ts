import path from "node:path";
import { buildStorageKey, readStorageObject, saveStorageObject, storagePublicUrl } from "@/lib/storage";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SOURCE_UPLOAD_DIR = path.join("uploads", "source");
const RESULT_UPLOAD_DIR = path.join("uploads", "result");
const RECEIPT_UPLOAD_DIR = path.join("uploads", "receipts");

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function detectImageMimeType(buffer: Buffer, fallbackMimeType: string) {
  if (buffer.length >= 12) {
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return "image/png";
    }

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }

    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return "image/webp";
    }
  }

  return fallbackMimeType;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .slice(0, 180);
}

export type StoredUpload = {
  buffer: Buffer;
  mimeType: string;
  publicUrl: string;
  storageKey: string;
  originalName: string | null;
};

export async function saveUploadedFile(file: File): Promise<StoredUpload> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("فرمت فایل باید JPG، PNG یا WEBP باشد.");
  }

  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error("حجم فایل باید کمتر از ۱۰ مگابایت باشد.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extensionFromType(file.type);
  const storageKey = buildStorageKey(SOURCE_UPLOAD_DIR, ext);
  const publicUrl = await saveStorageObject({
    buffer,
    contentType: file.type,
    key: storageKey,
  });

  return {
    buffer,
    mimeType: file.type,
    publicUrl,
    storageKey,
    originalName: file.name || null,
  };
}

export async function readStoredUpload(storageKey: string, mimeType: string) {
  return readStorageObject(storageKey, mimeType);
}

export async function saveGeneratedImage(buffer: Buffer, mimeType = "image/png") {
  const normalizedMimeType = detectImageMimeType(buffer, mimeType);
  const storageKey = buildStorageKey(RESULT_UPLOAD_DIR, extensionFromType(normalizedMimeType));
  const publicUrl = await saveStorageObject({
    buffer,
    contentType: normalizedMimeType,
    key: storageKey,
  });

  return { publicUrl, storageKey };
}

export async function saveReceiptFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("فرمت رسید باید JPG، PNG یا WEBP باشد.");
  }

  const maxSizeBytes = 8 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error("حجم رسید باید کمتر از ۸ مگابایت باشد.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = buildStorageKey(RECEIPT_UPLOAD_DIR, extensionFromType(file.type));
  const publicUrl = await saveStorageObject({
    buffer,
    contentType: file.type,
    key: storageKey,
  });

  return { publicUrl, storageKey };
}

export async function saveTextPromptSourceImage(prompt: string) {
  const storageKey = buildStorageKey(SOURCE_UPLOAD_DIR, "svg");
  const safePrompt = escapeSvgText(prompt);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#f6f1e8"/>
  <rect x="48" y="48" width="704" height="704" rx="36" fill="#fffdf9" stroke="#dcd1bf"/>
  <text x="400" y="340" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="28" font-weight="700" fill="#171411">Text to image test</text>
  <text x="400" y="402" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="20" fill="#6d665d">${safePrompt}</text>
</svg>`;

  await saveStorageObject({
    buffer: Buffer.from(svg, "utf8"),
    contentType: "image/svg+xml",
    key: storageKey,
  });
  return storagePublicUrl(storageKey);
}
