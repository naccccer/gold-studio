"use client";

import { useSyncExternalStore } from "react";

export type PendingUploadSource = "camera" | "files";
export type PendingUploadStatus =
  | "uploading"
  | "uploaded"
  | "saving_crop"
  | "cropped"
  | "failed";

export type PendingGalleryUpload = {
  id: string;
  source: PendingUploadSource;
  file: File;
  previewUrl: string;
  status: PendingUploadStatus;
  assetId?: string;
  fileUrl?: string;
  error?: string;
  supportCode?: string;
};

type UploadRouteSuccess = {
  assetId: string;
  fileUrl: string;
  title: string | null;
};

type CropRouteSuccess = {
  assetId: string;
  fileUrl: string;
};

type UploadRouteError = {
  error?: string;
  supportCode?: string;
};

const MAX_INITIAL_UPLOAD_EDGE = 2400;
const MAX_INITIAL_UPLOAD_BYTES = 4 * 1024 * 1024;
const INITIAL_UPLOAD_JPEG_QUALITY = 0.86;
const uploads = new Map<string, PendingGalleryUpload>();
const listeners = new Set<() => void>();
const uploadPromises = new Map<string, Promise<PendingGalleryUpload>>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function setUpload(uploadId: string, nextUpload: PendingGalleryUpload) {
  uploads.set(uploadId, nextUpload);
  emit();
}

function updateUpload(uploadId: string, patch: Partial<PendingGalleryUpload>) {
  const current = uploads.get(uploadId);
  if (!current) {
    return;
  }

  setUpload(uploadId, {
    ...current,
    ...patch,
  });
}

function parseErrorPayload(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const parsed = payload as UploadRouteError;
    return {
      message: typeof parsed.error === "string" ? parsed.error : fallback,
      supportCode: typeof parsed.supportCode === "string" ? parsed.supportCode : undefined,
    };
  }

  return {
    message: fallback,
    supportCode: undefined,
  };
}

function fallbackWithStatus(fallback: string, response: Response) {
  if (response.status === 413) {
    return `${fallback} حجم فایل برای سرور زیاد است. تصویر را کوچک‌تر کنید یا دوباره با کراپ کم‌حجم‌تر تلاش کنید.`;
  }

  if (response.status >= 500) {
    return `${fallback} خطای سرور هنگام ذخیره فایل رخ داد.`;
  }

  return fallback;
}

function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("تصویر انتخاب‌شده قابل آماده‌سازی نیست."));
    };
    image.src = objectUrl;
  });
}

async function prepareInitialUploadFile(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const image = await loadImageElement(file);
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  const longestEdge = Math.max(naturalWidth, naturalHeight);
  const shouldResize = longestEdge > MAX_INITIAL_UPLOAD_EDGE || file.size > MAX_INITIAL_UPLOAD_BYTES;

  if (!shouldResize) {
    return file;
  }

  const scale = Math.min(1, MAX_INITIAL_UPLOAD_EDGE / longestEdge);
  const outputWidth = Math.max(1, Math.round(naturalWidth * scale));
  const outputHeight = Math.max(1, Math.round(naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    return file;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(image, 0, 0, outputWidth, outputHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", INITIAL_UPLOAD_JPEG_QUALITY);
  });

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "gallery-upload";
  return new File([blob], `${baseName}-optimized.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

export function createPendingGalleryUpload(file: File, source: PendingUploadSource) {
  const uploadId = crypto.randomUUID();
  const previewUrl = URL.createObjectURL(file);

  const entry: PendingGalleryUpload = {
    id: uploadId,
    file,
    previewUrl,
    source,
    status: "uploading",
  };

  uploads.set(uploadId, entry);
  emit();
  return entry;
}

export function getPendingGalleryUpload(uploadId: string) {
  return uploads.get(uploadId) ?? null;
}

export function usePendingGalleryUpload(uploadId: string | null) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (uploadId ? uploads.get(uploadId) ?? null : null),
    () => null,
  );
}

export function clearPendingGalleryUpload(uploadId: string) {
  const current = uploads.get(uploadId);
  if (current) {
    URL.revokeObjectURL(current.previewUrl);
  }

  uploads.delete(uploadId);
  uploadPromises.delete(uploadId);
  emit();
}

export function startPendingGalleryUpload(uploadId: string) {
  const existingPromise = uploadPromises.get(uploadId);
  if (existingPromise) {
    return existingPromise;
  }

  const current = uploads.get(uploadId);
  if (!current) {
    return Promise.reject(new Error("آپلود انتخاب‌شده پیدا نشد."));
  }

  const task = (async () => {
    let uploadFile: File;
    try {
      uploadFile = await prepareInitialUploadFile(current.file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "آماده‌سازی تصویر برای آپلود کامل نشد.";
      updateUpload(uploadId, {
        status: "failed",
        error: message,
        supportCode: undefined,
      });
      throw new Error(message);
    }

    const formData = new FormData();
    formData.set("image", uploadFile);

    const response = await fetch("/api/gallery/uploads", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as UploadRouteSuccess | UploadRouteError | null;

    if (!response.ok || !payload || !("assetId" in payload) || !("fileUrl" in payload)) {
      const message = parseErrorPayload(payload, fallbackWithStatus("آپلود تصویر کامل نشد.", response));
      updateUpload(uploadId, {
        status: "failed",
        error: message.message,
        supportCode: message.supportCode,
      });
      throw new Error(message.message);
    }

    const uploaded = {
      ...(uploads.get(uploadId) ?? current),
      status: "uploaded" as const,
      assetId: payload.assetId,
      fileUrl: payload.fileUrl,
      error: undefined,
      supportCode: undefined,
    };

    setUpload(uploadId, uploaded);
    return uploaded;
  })();

  uploadPromises.set(uploadId, task);
  return task;
}

export async function waitForPendingGalleryUpload(uploadId: string) {
  const current = uploads.get(uploadId);
  if (!current) {
    throw new Error("آپلود انتخاب‌شده پیدا نشد.");
  }

  if ((current.status === "uploaded" || current.status === "cropped") && current.assetId) {
    return current;
  }

  const task = uploadPromises.get(uploadId);
  if (!task) {
    return startPendingGalleryUpload(uploadId);
  }

  return task;
}

export async function confirmPendingGalleryUpload(uploadId: string) {
  const readyUpload = await waitForPendingGalleryUpload(uploadId);
  if (!readyUpload.assetId) {
    throw new Error("فایل آپلودشده آماده نیست.");
  }

  const response = await fetch(`/api/gallery/uploads/${readyUpload.assetId}`, {
    method: "PATCH",
  });
  const payload = (await response.json().catch(() => null)) as CropRouteSuccess | UploadRouteError | null;

  if (!response.ok || !payload || !("assetId" in payload) || !("fileUrl" in payload)) {
    const message = parseErrorPayload(payload, fallbackWithStatus("ثبت تصویر بدون کراپ کامل نشد.", response));
    updateUpload(uploadId, {
      status: "failed",
      error: message.message,
      supportCode: message.supportCode,
    });
    throw new Error(message.message);
  }

  const nextUpload = {
    ...(uploads.get(uploadId) ?? readyUpload),
    status: "uploaded" as const,
    assetId: payload.assetId,
    fileUrl: payload.fileUrl,
    error: undefined,
    supportCode: undefined,
  };

  setUpload(uploadId, nextUpload);
  return nextUpload;
}

export async function applyCropToPendingUpload(uploadId: string, croppedFile: File) {
  const readyUpload = await waitForPendingGalleryUpload(uploadId);
  if (!readyUpload.assetId) {
    throw new Error("فایل آپلودشده برای کراپ آماده نیست.");
  }

  updateUpload(uploadId, {
    status: "saving_crop",
    error: undefined,
    supportCode: undefined,
  });

  const formData = new FormData();
  formData.set("image", croppedFile);

  const response = await fetch(`/api/gallery/uploads/${readyUpload.assetId}/crop`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as CropRouteSuccess | UploadRouteError | null;

  if (!response.ok || !payload || !("assetId" in payload) || !("fileUrl" in payload)) {
    const message = parseErrorPayload(payload, fallbackWithStatus("ذخیره کراپ کامل نشد.", response));
    updateUpload(uploadId, {
      status: "failed",
      error: message.message,
      supportCode: message.supportCode,
    });
    throw new Error(message.message);
  }

  const nextUpload = {
    ...(uploads.get(uploadId) ?? readyUpload),
    status: "cropped" as const,
    assetId: payload.assetId,
    fileUrl: payload.fileUrl,
    error: undefined,
    supportCode: undefined,
  };

  setUpload(uploadId, nextUpload);
  return nextUpload;
}

export async function discardPendingGalleryUpload(uploadId: string) {
  const current = uploads.get(uploadId);
  if (!current) {
    return;
  }

  try {
    if (current.status === "failed" && !current.assetId) {
      return;
    }

    const uploaded = current.assetId ? current : await waitForPendingGalleryUpload(uploadId);
    if (uploaded.assetId) {
      await fetch(`/api/gallery/uploads/${uploaded.assetId}`, { method: "DELETE" });
    }
  } catch {
    // The upload may have failed or been interrupted; clearing the local draft is still correct.
  } finally {
    clearPendingGalleryUpload(uploadId);
  }
}
