import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SOURCE_UPLOAD_DIR = path.join("uploads", "source");
const RESULT_UPLOAD_DIR = path.join("uploads", "result");

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function publicUrlFromStorageKey(storageKey: string) {
  return `/${storageKey.split(path.sep).join("/")}`;
}

function publicPathFromStorageKey(storageKey: string) {
  const normalized = path.normalize(storageKey);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error("مسیر فایل معتبر نیست.");
  }
  return path.join(process.cwd(), "public", normalized);
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
  const filename = `${randomUUID()}.${ext}`;
  const storageKey = path.join(SOURCE_UPLOAD_DIR, filename);
  const targetPath = publicPathFromStorageKey(storageKey);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, buffer);

  return {
    buffer,
    mimeType: file.type,
    publicUrl: publicUrlFromStorageKey(storageKey),
    storageKey,
    originalName: file.name || null,
  };
}

export async function readStoredUpload(storageKey: string, mimeType: string) {
  const buffer = await readFile(publicPathFromStorageKey(storageKey));
  return { buffer, mimeType };
}

export async function saveGeneratedImage(buffer: Buffer) {
  const filename = `${randomUUID()}.png`;
  const storageKey = path.join(RESULT_UPLOAD_DIR, filename);
  const targetPath = publicPathFromStorageKey(storageKey);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, buffer);
  return publicUrlFromStorageKey(storageKey);
}

export async function saveTextPromptSourceImage(prompt: string) {
  const filename = `${randomUUID()}.svg`;
  const storageKey = path.join(SOURCE_UPLOAD_DIR, filename);
  const targetPath = publicPathFromStorageKey(storageKey);
  const safePrompt = escapeSvgText(prompt);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#f6f1e8"/>
  <rect x="48" y="48" width="704" height="704" rx="36" fill="#fffdf9" stroke="#dcd1bf"/>
  <text x="400" y="340" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="28" font-weight="700" fill="#171411">Text to image test</text>
  <text x="400" y="402" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="20" fill="#6d665d">${safePrompt}</text>
</svg>`;

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, svg);
  return publicUrlFromStorageKey(storageKey);
}
