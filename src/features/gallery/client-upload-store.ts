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
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
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
    return Promise.reject(new Error("آپلود انتخاب شده پیدا نشد."));
  }

  const task = (async () => {
    const formData = new FormData();
    formData.set("image", current.file);

    const response = await fetch("/api/gallery/uploads", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as UploadRouteSuccess | { error?: string } | null;

    if (!response.ok || !payload || !("assetId" in payload) || !("fileUrl" in payload)) {
      const message = parseErrorPayload(payload, "آپلود تصویر کامل نشد.");
      updateUpload(uploadId, {
        status: "failed",
        error: message,
      });
      throw new Error(message);
    }

    const uploaded = {
      ...(uploads.get(uploadId) ?? current),
      status: "uploaded" as const,
      assetId: payload.assetId,
      fileUrl: payload.fileUrl,
      error: undefined,
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
    throw new Error("آپلود انتخاب شده پیدا نشد.");
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

export async function applyCropToPendingUpload(uploadId: string, croppedFile: File) {
  const readyUpload = await waitForPendingGalleryUpload(uploadId);
  if (!readyUpload.assetId) {
    throw new Error("فایل آپلود شده برای کراپ آماده نیست.");
  }

  updateUpload(uploadId, {
    status: "saving_crop",
    error: undefined,
  });

  const formData = new FormData();
  formData.set("image", croppedFile);

  const response = await fetch(`/api/gallery/uploads/${readyUpload.assetId}/crop`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as CropRouteSuccess | { error?: string } | null;

  if (!response.ok || !payload || !("assetId" in payload) || !("fileUrl" in payload)) {
    const message = parseErrorPayload(payload, "ذخیره کراپ کامل نشد.");
    updateUpload(uploadId, {
      status: "failed",
      error: message,
    });
    throw new Error(message);
  }

  const nextUpload = {
    ...(uploads.get(uploadId) ?? readyUpload),
    status: "cropped" as const,
    assetId: payload.assetId,
    fileUrl: payload.fileUrl,
    error: undefined,
  };

  setUpload(uploadId, nextUpload);
  return nextUpload;
}
