import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .slice(0, 180);
}

export async function saveUploadedFile(file: File) {
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

  const targetDir = path.join(process.cwd(), "public", "uploads", "source");
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, filename), buffer);

  return {
    buffer,
    mimeType: file.type,
    publicUrl: `/uploads/source/${filename}`,
  };
}

export async function saveGeneratedImage(buffer: Buffer) {
  const filename = `${randomUUID()}.png`;
  const targetDir = path.join(process.cwd(), "public", "uploads", "result");
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, filename), buffer);
  return `/uploads/result/${filename}`;
}

export async function saveTextPromptSourceImage(prompt: string) {
  const filename = `${randomUUID()}.svg`;
  const targetDir = path.join(process.cwd(), "public", "uploads", "source");
  const safePrompt = escapeSvgText(prompt);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#f8fafc"/>
  <rect x="48" y="48" width="704" height="704" rx="36" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="400" y="340" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">Text to image test</text>
  <text x="400" y="402" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="20" fill="#475569">${safePrompt}</text>
</svg>`;

  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, filename), svg);
  return `/uploads/source/${filename}`;
}
