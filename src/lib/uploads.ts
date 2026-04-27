import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
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
