import path from "node:path";
import sharp from "sharp";
import { buildStorageKey, readStorageObject, saveStorageObject, storagePublicUrl } from "@/lib/storage";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SOURCE_UPLOAD_DIR = path.join("uploads", "source");
const RESULT_UPLOAD_DIR = path.join("uploads", "result");
const RECEIPT_UPLOAD_DIR = path.join("uploads", "receipts");
const STYLE_PREVIEW_UPLOAD_DIR = path.join("uploads", "style-previews");
const STYLE_REFERENCE_UPLOAD_DIR = path.join("uploads", "style-references");
const HOME_CAROUSEL_UPLOAD_DIR = path.join("uploads", "home-carousel");
const NORMALIZED_UPLOAD_MIME_TYPE = "image/jpeg";
const NORMALIZED_UPLOAD_EXTENSION = "jpg";
const MAX_SOURCE_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_RECEIPT_INPUT_BYTES = 10 * 1024 * 1024;
const SOURCE_MAX_EDGE = 2400;
const SOURCE_JPEG_QUALITY = 86;
const RECEIPT_MAX_EDGE = 1800;
const RECEIPT_JPEG_QUALITY = 82;

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

function detectKnownImageMimeType(buffer: Buffer) {
  if (buffer.length < 12) {
    return null;
  }

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

  return null;
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

type NormalizeImageOptions = {
  maxInputBytes: number;
  maxEdge: number;
  quality: number;
  invalidTypeMessage: string;
  tooLargeMessage: string;
  invalidImageMessage: string;
};

async function normalizeUploadImage(file: File, options: NormalizeImageOptions) {
  if (file.size > options.maxInputBytes) {
    throw new Error(options.tooLargeMessage);
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const detectedInputType = detectKnownImageMimeType(inputBuffer);
  if (!detectedInputType) {
    throw new Error(options.invalidImageMessage);
  }

  if (file.type && !ALLOWED_TYPES.has(file.type) && !ALLOWED_TYPES.has(detectedInputType)) {
    throw new Error(options.invalidTypeMessage);
  }

  try {
    const normalizedBuffer = await sharp(inputBuffer, { failOn: "none" })
      .rotate()
      .resize({
        width: options.maxEdge,
        height: options.maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({
        quality: options.quality,
        mozjpeg: true,
      })
      .toBuffer();

    if (!detectKnownImageMimeType(normalizedBuffer)) {
      throw new Error(options.invalidImageMessage);
    }

    return {
      buffer: normalizedBuffer,
      mimeType: NORMALIZED_UPLOAD_MIME_TYPE,
      extension: NORMALIZED_UPLOAD_EXTENSION,
    };
  } catch (error) {
    console.error("[upload-image-normalize-failed]", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      error,
    });
    throw new Error(options.invalidImageMessage);
  }
}

export async function saveUploadedFile(file: File): Promise<StoredUpload> {
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("فرمت فایل باید JPG، PNG یا WEBP باشد.");
  }

  const maxSizeBytes = MAX_SOURCE_INPUT_BYTES;
  if (file.size > maxSizeBytes) {
    throw new Error("حجم فایل باید کمتر از ۱۵ مگابایت باشد.");
  }

  const normalized = await normalizeUploadImage(file, {
    maxInputBytes: MAX_SOURCE_INPUT_BYTES,
    maxEdge: SOURCE_MAX_EDGE,
    quality: SOURCE_JPEG_QUALITY,
    invalidTypeMessage: "فرمت فایل باید JPG، PNG یا WEBP باشد.",
    tooLargeMessage: "حجم فایل باید کمتر از ۱۵ مگابایت باشد.",
    invalidImageMessage: "تصویر انتخاب‌شده معتبر نیست یا قابل پردازش نبود.",
  });
  const storageKey = buildStorageKey(SOURCE_UPLOAD_DIR, normalized.extension);
  const publicUrl = await saveStorageObject({
    buffer: normalized.buffer,
    contentType: normalized.mimeType,
    key: storageKey,
  });

  return {
    buffer: normalized.buffer,
    mimeType: normalized.mimeType,
    publicUrl,
    storageKey,
    originalName: file.name || null,
  };
}

export async function readStoredUpload(storageKey: string, mimeType: string) {
  return readStorageObject(storageKey, mimeType);
}

export async function saveGeneratedImage(buffer: Buffer, mimeType = "image/png") {
  const detectedMimeType = detectKnownImageMimeType(buffer);
  if (!detectedMimeType) {
    throw new Error("فایل خروجی سرویس تولید تصویر، تصویر معتبر PNG/JPEG/WEBP نبود و ذخیره نشد.");
  }

  const normalizedMimeType = detectImageMimeType(buffer, detectedMimeType || mimeType);
  const storageKey = buildStorageKey(RESULT_UPLOAD_DIR, extensionFromType(normalizedMimeType));
  const publicUrl = await saveStorageObject({
    buffer,
    contentType: normalizedMimeType,
    key: storageKey,
  });

  return { publicUrl, storageKey };
}

export async function saveReceiptFile(file: File) {
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("فرمت رسید باید JPG، PNG یا WEBP باشد.");
  }

  const maxSizeBytes = MAX_RECEIPT_INPUT_BYTES;
  if (file.size > maxSizeBytes) {
    throw new Error("حجم رسید باید کمتر از ۱۰ مگابایت باشد.");
  }

  const normalized = await normalizeUploadImage(file, {
    maxInputBytes: MAX_RECEIPT_INPUT_BYTES,
    maxEdge: RECEIPT_MAX_EDGE,
    quality: RECEIPT_JPEG_QUALITY,
    invalidTypeMessage: "فرمت رسید باید JPG، PNG یا WEBP باشد.",
    tooLargeMessage: "حجم رسید باید کمتر از ۱۰ مگابایت باشد.",
    invalidImageMessage: "تصویر رسید معتبر نیست یا قابل پردازش نبود.",
  });
  const storageKey = buildStorageKey(RECEIPT_UPLOAD_DIR, normalized.extension);
  const publicUrl = await saveStorageObject({
    buffer: normalized.buffer,
    contentType: normalized.mimeType,
    key: storageKey,
  });

  return { publicUrl, storageKey };
}

export async function saveStylePreviewFile(file: File) {
  const normalized = await normalizeUploadImage(file, {
    maxInputBytes: MAX_RECEIPT_INPUT_BYTES,
    maxEdge: 1400,
    quality: 84,
    invalidTypeMessage: "فرمت عکس سبک باید JPG، PNG یا WEBP باشد.",
    tooLargeMessage: "حجم عکس سبک باید کمتر از ۱۰ مگابایت باشد.",
    invalidImageMessage: "عکس سبک معتبر نیست یا قابل پردازش نبود.",
  });
  const storageKey = buildStorageKey(STYLE_PREVIEW_UPLOAD_DIR, normalized.extension);
  const publicUrl = await saveStorageObject({
    buffer: normalized.buffer,
    contentType: normalized.mimeType,
    key: storageKey,
  });

  return { publicUrl, storageKey };
}

export async function saveHomeCarouselFile(file: File) {
  const normalized = await normalizeUploadImage(file, {
    maxInputBytes: MAX_RECEIPT_INPUT_BYTES,
    maxEdge: 1800,
    quality: 86,
    invalidTypeMessage: "فرمت عکس کاروسل باید JPG، PNG یا WEBP باشد.",
    tooLargeMessage: "حجم عکس کاروسل باید کمتر از ۱۰ مگابایت باشد.",
    invalidImageMessage: "عکس کاروسل معتبر نیست یا قابل پردازش نبود.",
  });
  const storageKey = buildStorageKey(HOME_CAROUSEL_UPLOAD_DIR, normalized.extension);
  const publicUrl = await saveStorageObject({
    buffer: normalized.buffer,
    contentType: normalized.mimeType,
    key: storageKey,
  });

  return { publicUrl, storageKey };
}

export async function saveStyleReferenceFile(file: File): Promise<StoredUpload> {
  const normalized = await normalizeUploadImage(file, {
    maxInputBytes: MAX_SOURCE_INPUT_BYTES,
    maxEdge: SOURCE_MAX_EDGE,
    quality: SOURCE_JPEG_QUALITY,
    invalidTypeMessage: "فرمت عکس نمونه باید JPG، PNG یا WEBP باشد.",
    tooLargeMessage: "حجم عکس نمونه باید کمتر از ۱۵ مگابایت باشد.",
    invalidImageMessage: "عکس نمونه معتبر نیست یا قابل پردازش نبود.",
  });
  const storageKey = buildStorageKey(STYLE_REFERENCE_UPLOAD_DIR, normalized.extension);
  const publicUrl = await saveStorageObject({
    buffer: normalized.buffer,
    contentType: normalized.mimeType,
    key: storageKey,
  });

  return {
    buffer: normalized.buffer,
    mimeType: normalized.mimeType,
    publicUrl,
    storageKey,
    originalName: file.name || null,
  };
}

export async function saveStyleReferenceFromStoredObject({
  storageKey: sourceStorageKey,
  mimeType,
  originalName,
}: {
  storageKey: string;
  mimeType: string;
  originalName?: string | null;
}): Promise<StoredUpload> {
  const source = await readStorageObject(sourceStorageKey, mimeType);
  const extension = extensionFromType(source.mimeType);
  const storageKey = buildStorageKey(STYLE_REFERENCE_UPLOAD_DIR, extension);
  const publicUrl = await saveStorageObject({
    buffer: source.buffer,
    contentType: source.mimeType,
    key: storageKey,
  });

  return {
    buffer: source.buffer,
    mimeType: source.mimeType,
    publicUrl,
    storageKey,
    originalName: originalName ?? null,
  };
}

export async function saveTextPromptSourceImage(prompt: string) {
  const storageKey = buildStorageKey(SOURCE_UPLOAD_DIR, NORMALIZED_UPLOAD_EXTENSION);
  const safePrompt = escapeSvgText(prompt);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#f6f1e8"/>
  <rect x="48" y="48" width="704" height="704" rx="36" fill="#fffdf9" stroke="#dcd1bf"/>
  <text x="400" y="340" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="28" font-weight="700" fill="#171411">Text to image test</text>
  <text x="400" y="402" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="20" fill="#6d665d">${safePrompt}</text>
</svg>`;
  const buffer = await sharp(Buffer.from(svg, "utf8"))
    .jpeg({
      quality: SOURCE_JPEG_QUALITY,
      mozjpeg: true,
    })
    .toBuffer();

  await saveStorageObject({
    buffer,
    contentType: NORMALIZED_UPLOAD_MIME_TYPE,
    key: storageKey,
  });
  return storagePublicUrl(storageKey);
}
