"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { Crop, ImageIcon, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyCropToPendingUpload,
  clearPendingGalleryUpload,
  confirmPendingGalleryUpload,
  discardPendingGalleryUpload,
  type PendingGalleryUpload,
  usePendingGalleryUpload,
} from "@/features/gallery/client-upload-store";

type GalleryCropScreenProps = {
  uploadId: string;
  onClose: (options?: { refresh?: boolean; selectedAssetId?: string; selectedAssetFileUrl?: string }) => void;
  progressLabel?: string;
};

type FrameSize = {
  width: number;
  height: number;
};

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ResizeHandle = "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw";

const CROP_MIN_SIZE = 112;

function ErrorNotice({
  title,
  message,
  supportCode,
}: {
  title: string;
  message: string;
  supportCode?: string;
}) {
  return (
    <div className="rounded-[1.1rem] border border-danger/18 bg-[#fff6f1] px-3.5 py-3 text-right shadow-[0_16px_30px_-26px_rgba(125,40,24,0.28)]">
      <p className="text-sm font-semibold text-[#8f3c2f]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[#9a5c4e]" style={{ textAlign: "justify", textAlignLast: "right" }}>
        {message}
      </p>
      {supportCode ? (
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/88 px-2.5 py-1 text-[11px] text-[#8f3c2f]">
          <span>کد پیگیری</span>
          <span dir="ltr" className="font-semibold">{supportCode}</span>
        </div>
      ) : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getInitialCropRect(frameSize: FrameSize, imageBounds?: CropRect | null): CropRect | null {
  if (!frameSize.width || !frameSize.height) {
    return null;
  }

  const base = imageBounds ?? { x: 0, y: 0, width: frameSize.width, height: frameSize.height };
  const inset = Math.max(12, Math.round(Math.min(base.width, base.height) * 0.06));

  return {
    x: base.x + inset,
    y: base.y + inset,
    width: Math.max(CROP_MIN_SIZE, base.width - inset * 2),
    height: Math.max(CROP_MIN_SIZE, base.height - inset * 2),
  };
}

function normalizeCropRect(rect: CropRect, frameSize: FrameSize) {
  const width = clamp(rect.width, Math.min(CROP_MIN_SIZE, frameSize.width), frameSize.width);
  const height = clamp(rect.height, Math.min(CROP_MIN_SIZE, frameSize.height), frameSize.height);

  return {
    x: clamp(rect.x, 0, Math.max(0, frameSize.width - width)),
    y: clamp(rect.y, 0, Math.max(0, frameSize.height - height)),
    width,
    height,
  };
}

function statusCopy(upload: PendingGalleryUpload | null) {
  if (!upload) {
    return {
      label: "فایل انتخاب شده پیدا نشد",
      description: "پنجره را ببندید و دوباره از گالری عکس را انتخاب کنید.",
    };
  }

  if (upload.status === "uploading") {
    return {
      label: "در حال آپلود تصویر",
      description: "کراپ را تنظیم کنید. فایل اصلی همزمان در پس‌زمینه در حال ذخیره شدن است.",
    };
  }

  if (upload.status === "uploaded") {
    return {
      label: "آپلود کامل شد",
      description: "حالا می‌توانید کراپ را ثبت کنید یا بدون کراپ به گالری برگردید.",
    };
  }

  if (upload.status === "saving_crop") {
    return {
      label: "در حال ذخیره کراپ",
      description: "نسخه کراپ‌شده در حال جایگزینی تصویر خام است.",
    };
  }

  if (upload.status === "cropped") {
    return {
      label: "کراپ ذخیره شد",
      description: "تصویر آماده است و بعد از بستن پنجره در گالری دیده می‌شود.",
    };
  }

  return {
    label: "آپلود کامل نشد",
    description: upload.error || "لطفا دوباره از گالری شروع کنید.",
  };
}

function useFrameSize(targetRef: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState<FrameSize>({ width: 0, height: 0 });

  useEffect(() => {
    const node = targetRef.current;
    if (!node) {
      return;
    }

    const updateSize = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [targetRef]);

  return size;
}

async function loadPreviewImage(sourceUrl: string) {
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("پیش‌نمایش تصویر قابل بارگذاری نیست."));
    image.src = sourceUrl;
  });

  return image;
}

async function buildCroppedFile(
  upload: PendingGalleryUpload,
  naturalWidth: number,
  naturalHeight: number,
  frameWidth: number,
  frameHeight: number,
  cropRect: CropRect,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const image = await loadPreviewImage(upload.previewUrl);
  const containScale = Math.min(frameWidth / naturalWidth, frameHeight / naturalHeight);
  const renderScale = containScale * zoom;
  const displayedWidth = naturalWidth * renderScale;
  const displayedHeight = naturalHeight * renderScale;
  const left = frameWidth / 2 - displayedWidth / 2 + offsetX;
  const top = frameHeight / 2 - displayedHeight / 2 + offsetY;

  const sourceX = clamp((cropRect.x - left) / renderScale, 0, naturalWidth);
  const sourceY = clamp((cropRect.y - top) / renderScale, 0, naturalHeight);
  const sourceWidth = clamp(cropRect.width / renderScale, 1, naturalWidth - sourceX);
  const sourceHeight = clamp(cropRect.height / renderScale, 1, naturalHeight - sourceY);
  const outputScale = Math.max(1, 1080 / Math.max(sourceWidth, sourceHeight));
  const outputWidth = Math.max(360, Math.round(sourceWidth * outputScale));
  const outputHeight = Math.max(360, Math.round(sourceHeight * outputScale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("امکان ساخت خروجی کراپ وجود ندارد.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("خروجی کراپ ساخته نشد."));
      }
    }, "image/jpeg", 0.9);
  });

  const baseName = upload.file.name.replace(/\.[^.]+$/, "") || "gallery-crop";
  return new File([blob], `${baseName}-crop.jpg`, { type: "image/jpeg" });
}

export function GalleryCropScreen({ uploadId, onClose, progressLabel }: GalleryCropScreenProps) {
  const upload = usePendingGalleryUpload(uploadId);
  const frameRef = useRef<HTMLDivElement>(null);
  const frameSize = useFrameSize(frameRef);
  const dragStateRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);
  const cropDragStateRef = useRef<{
    startX: number;
    startY: number;
    startRect: CropRect;
    mode: "move" | ResizeHandle;
  } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [submitting, setSubmitting] = useState<"crop" | "skip" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const uploadStatusLabel = upload ? statusCopy(upload).label : undefined;

  const containScale = useMemo(() => {
    if (!frameSize.width || !frameSize.height || !naturalSize.width || !naturalSize.height) {
      return 0;
    }

    return Math.min(frameSize.width / naturalSize.width, frameSize.height / naturalSize.height);
  }, [frameSize.height, frameSize.width, naturalSize.height, naturalSize.width]);

  const displayedWidth = naturalSize.width * containScale * zoom;
  const displayedHeight = naturalSize.height * containScale * zoom;
  const limitX = Math.max(0, (displayedWidth - frameSize.width) / 2);
  const limitY = Math.max(0, (displayedHeight - frameSize.height) / 2);
  const clampedOffsetX = clamp(offsetX, -limitX, limitX);
  const clampedOffsetY = clamp(offsetY, -limitY, limitY);
  const displayedImageBounds = displayedWidth && displayedHeight
    ? {
        x: frameSize.width / 2 - displayedWidth / 2 + clampedOffsetX,
        y: frameSize.height / 2 - displayedHeight / 2 + clampedOffsetY,
        width: displayedWidth,
        height: displayedHeight,
      }
    : null;
  const activeCropRect = cropRect
    ? normalizeCropRect(cropRect, frameSize)
    : getInitialCropRect(frameSize, displayedImageBounds);

  function closeModal(options?: { refresh?: boolean; discard?: boolean; selectedAssetId?: string; selectedAssetFileUrl?: string }) {
    const shouldDiscard = options?.discard ?? true;
    if (upload) {
      if (shouldDiscard) {
        void discardPendingGalleryUpload(upload.id);
      } else if (upload.status === "failed" || upload.status === "cropped") {
        clearPendingGalleryUpload(upload.id);
      }
    }

    onClose({
      refresh: options?.refresh,
      selectedAssetId: options?.selectedAssetId,
      selectedAssetFileUrl: options?.selectedAssetFileUrl,
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (cropDragStateRef.current) {
      return;
    }

    if (!frameSize.width || !frameSize.height || !naturalSize.width || !naturalSize.height) {
      return;
    }

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: clampedOffsetX,
      startOffsetY: clampedOffsetY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState) {
      return;
    }

    setOffsetX(clamp(dragState.startOffsetX + (event.clientX - dragState.startX), -limitX, limitX));
    setOffsetY(clamp(dragState.startOffsetY + (event.clientY - dragState.startY), -limitY, limitY));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function resizeCropRect(startRect: CropRect, mode: "move" | ResizeHandle, deltaX: number, deltaY: number) {
    const minimumSize = Math.min(CROP_MIN_SIZE, frameSize.width, frameSize.height);
    const next = { ...startRect };

    if (mode === "move") {
      next.x = clamp(startRect.x + deltaX, 0, Math.max(0, frameSize.width - startRect.width));
      next.y = clamp(startRect.y + deltaY, 0, Math.max(0, frameSize.height - startRect.height));
      return next;
    }

    if (mode.includes("w")) {
      const right = startRect.x + startRect.width;
      next.x = clamp(startRect.x + deltaX, 0, right - minimumSize);
      next.width = right - next.x;
    }

    if (mode.includes("e")) {
      next.width = clamp(startRect.width + deltaX, minimumSize, frameSize.width - startRect.x);
    }

    if (mode.includes("n")) {
      const bottom = startRect.y + startRect.height;
      next.y = clamp(startRect.y + deltaY, 0, bottom - minimumSize);
      next.height = bottom - next.y;
    }

    if (mode.includes("s")) {
      next.height = clamp(startRect.height + deltaY, minimumSize, frameSize.height - startRect.y);
    }

    return next;
  }

  function handleCropPointerDown(event: ReactPointerEvent<HTMLElement>, mode: "move" | ResizeHandle) {
    if (!activeCropRect || !frameSize.width || !frameSize.height) {
      return;
    }

    event.stopPropagation();
    cropDragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startRect: activeCropRect,
      mode,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCropPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const dragState = cropDragStateRef.current;
    if (!dragState) {
      return;
    }

    event.stopPropagation();
    setCropRect(resizeCropRect(
      dragState.startRect,
      dragState.mode,
      event.clientX - dragState.startX,
      event.clientY - dragState.startY,
    ));
  }

  function handleCropPointerUp(event: ReactPointerEvent<HTMLElement>) {
    cropDragStateRef.current = null;
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function handleSkipCrop() {
    if (!upload) {
      return;
    }

    setSubmitting("skip");
    setLocalError(null);

    try {
      const confirmed = await confirmPendingGalleryUpload(upload.id);
      clearPendingGalleryUpload(upload.id);
      closeModal({
        refresh: true,
        discard: false,
        selectedAssetId: confirmed.assetId,
        selectedAssetFileUrl: confirmed.fileUrl,
      });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "بازگشت به گالری بدون کراپ انجام نشد.");
      setSubmitting(null);
    }
  }

  async function handleApplyCrop() {
    if (!upload || !frameSize.width || !frameSize.height || !activeCropRect || !naturalSize.width || !naturalSize.height) {
      return;
    }

    setSubmitting("crop");
    setLocalError(null);

    try {
      const croppedFile = await buildCroppedFile(
        upload,
        naturalSize.width,
        naturalSize.height,
        frameSize.width,
        frameSize.height,
        activeCropRect,
        zoom,
        clampedOffsetX,
        clampedOffsetY,
      );

      const cropped = await applyCropToPendingUpload(upload.id, croppedFile);
      clearPendingGalleryUpload(upload.id);
      closeModal({
        refresh: true,
        discard: false,
        selectedAssetId: cropped.assetId,
        selectedAssetFileUrl: cropped.fileUrl,
      });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "ذخیره کراپ انجام نشد.");
      setSubmitting(null);
    }
  }

  function renderResizeHandle(handle: ResizeHandle, positionClassName: string, visualClassName: string) {
    const labels: Record<ResizeHandle, string> = {
      n: "تغییر اندازه از بالا",
      e: "تغییر اندازه از راست",
      s: "تغییر اندازه از پایین",
      w: "تغییر اندازه از چپ",
      ne: "تغییر اندازه از بالا راست",
      nw: "تغییر اندازه از بالا چپ",
      se: "تغییر اندازه از پایین راست",
      sw: "تغییر اندازه از پایین چپ",
    };

    return (
      <button
        key={handle}
        type="button"
        aria-label={labels[handle]}
        className={`absolute flex h-11 w-11 touch-none items-center justify-center rounded-full focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] ${positionClassName}`}
        onPointerDown={(event) => handleCropPointerDown(event, handle)}
        onPointerMove={handleCropPointerMove}
        onPointerUp={handleCropPointerUp}
        onPointerCancel={handleCropPointerUp}
      >
        <span aria-hidden={true} className={visualClassName} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-[#11100e]/56 px-3 pb-3 pt-4 backdrop-blur-sm md:items-center md:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-crop-title"
        aria-label={uploadStatusLabel}
        className="grid max-h-[calc(100dvh-2rem)] w-full max-w-[28rem] grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden rounded-[1.7rem] border border-white/15 bg-[linear-gradient(180deg,#f7f2ea_0%,#f2eadf_100%)] shadow-[0_36px_96px_-42px_rgba(0,0,0,0.72)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/6 px-4 pb-2.5 pt-3 md:px-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p id="gallery-crop-title" className="text-sm font-semibold text-foreground md:text-base">
                کراپ تصویر
              </p>
              {progressLabel ? (
                <span className="rounded-full border border-accent-soft bg-accent-wash px-2.5 py-1 text-[10px] font-semibold text-accent-deep" dir="ltr">
                  {progressLabel}
                </span>
              ) : null}
            </div>
            <p className="max-w-[16rem] text-[11px] leading-5 text-muted md:max-w-none md:text-xs md:leading-6">
              قاب را تنظیم کنید تا محصول تمیز و نزدیک به مرکز بماند.
            </p>
          </div>
          <button
            type="button"
            onClick={() => closeModal()}
            aria-label="بستن پنجره کراپ"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/8 bg-white/72 text-foreground transition hover:bg-white"
          >
            <X aria-hidden={true} className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-3 pb-2.5 pt-2.5 md:px-5 md:pb-4">
          {!upload ? (
            <div className="rounded-[1.25rem] border border-border/70 bg-surface px-4 py-6 text-center">
              <ImageIcon aria-hidden={true} className="mx-auto h-6 w-6 text-muted" />
              <p className="mt-3 text-sm text-foreground">فایل انتخاب شده برای کراپ پیدا نشد.</p>
              <p className="mt-1 text-xs leading-6 text-muted">پنجره را ببندید و دوباره از گالری شروع کنید.</p>
            </div>
          ) : (
            <div className="space-y-2.5 md:space-y-3">
              <section className="rounded-[1.35rem] border border-white/80 bg-[#efe7db] p-2.5 shadow-[0_28px_58px_-46px_rgba(17,16,14,0.32)] md:p-3">
                <div
                  ref={frameRef}
                  className="relative aspect-[4/3] touch-none overflow-hidden rounded-[1.15rem] bg-[#11100e]"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={upload.id}
                    src={upload.previewUrl}
                    alt="پیش نمایش کراپ"
                    draggable={false}
                    onLoad={(event) => {
                      const target = event.currentTarget;
                      setNaturalSize({
                        width: target.naturalWidth,
                        height: target.naturalHeight,
                      });
                    }}
                    className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                    style={{
                      width: displayedWidth || undefined,
                      height: displayedHeight || undefined,
                      transform: `translate(calc(-50% + ${clampedOffsetX}px), calc(-50% + ${clampedOffsetY}px))`,
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 border border-white/18" />
                  {activeCropRect ? (
                    <>
                      <div
                        className="pointer-events-none absolute rounded-[1rem] shadow-[0_0_0_999px_rgba(0,0,0,0.34)]"
                        style={{
                          left: activeCropRect.x,
                          top: activeCropRect.y,
                          width: activeCropRect.width,
                          height: activeCropRect.height,
                        }}
                      />
                      <div
                        className="absolute rounded-[1rem] border border-white/76 shadow-[0_14px_42px_-24px_rgba(0,0,0,0.75)] touch-none"
                        style={{
                          left: activeCropRect.x,
                          top: activeCropRect.y,
                          width: activeCropRect.width,
                          height: activeCropRect.height,
                        }}
                        onPointerDown={(event) => handleCropPointerDown(event, "move")}
                        onPointerMove={handleCropPointerMove}
                        onPointerUp={handleCropPointerUp}
                        onPointerCancel={handleCropPointerUp}
                      >
                        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 overflow-hidden rounded-[0.95rem]">
                          {Array.from({ length: 9 }).map((_, index) => (
                            <span key={index} className="border border-white/18" />
                          ))}
                        </div>
                        {renderResizeHandle(
                          "nw",
                          "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
                          "h-5 w-5 rounded-full border border-white/85 bg-[#f7f2ea] shadow-[0_8px_22px_-12px_rgba(0,0,0,0.85)]",
                        )}
                        {renderResizeHandle(
                          "ne",
                          "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
                          "h-5 w-5 rounded-full border border-white/85 bg-[#f7f2ea] shadow-[0_8px_22px_-12px_rgba(0,0,0,0.85)]",
                        )}
                        {renderResizeHandle(
                          "sw",
                          "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
                          "h-5 w-5 rounded-full border border-white/85 bg-[#f7f2ea] shadow-[0_8px_22px_-12px_rgba(0,0,0,0.85)]",
                        )}
                        {renderResizeHandle(
                          "se",
                          "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
                          "h-5 w-5 rounded-full border border-white/85 bg-[#f7f2ea] shadow-[0_8px_22px_-12px_rgba(0,0,0,0.85)]",
                        )}
                        {renderResizeHandle(
                          "n",
                          "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
                          "h-2.5 w-11 rounded-full bg-white/78 shadow-[0_8px_22px_-14px_rgba(0,0,0,0.85)]",
                        )}
                        {renderResizeHandle(
                          "s",
                          "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
                          "h-2.5 w-11 rounded-full bg-white/78 shadow-[0_8px_22px_-14px_rgba(0,0,0,0.85)]",
                        )}
                        {renderResizeHandle(
                          "w",
                          "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
                          "h-11 w-2.5 rounded-full bg-white/78 shadow-[0_8px_22px_-14px_rgba(0,0,0,0.85)]",
                        )}
                        {renderResizeHandle(
                          "e",
                          "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
                          "h-11 w-2.5 rounded-full bg-white/78 shadow-[0_8px_22px_-14px_rgba(0,0,0,0.85)]",
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[1.15rem] border border-white/78 bg-white/55 px-3.5 py-2.5">
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted md:text-xs">
                  <span>بزرگنمایی</span>
                  <span dir="ltr">{zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={2.8}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full accent-accent"
                />
                <p className="hidden">
                  تصویر را جابه‌جا کنید تا محصول داخل قاب دقیق قرار بگیرد. بعد از تایید، همین نسخه در گالری ذخیره می‌شود.
                </p>
              </section>

              {localError && localError !== upload.error ? (
                <ErrorNotice title="این مرحله کامل نشد" message={localError} />
              ) : null}
              {upload.error ? (
                <ErrorNotice
                  title="این مرحله کامل نشد"
                  message={upload.error}
                  supportCode={upload.supportCode}
                />
              ) : null}
            </div>
          )}
        </div>

        {upload ? (
          <div className="border-t border-black/6 bg-white/48 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 md:px-5 md:pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                className="h-12 rounded-[1rem]"
                disabled={submitting !== null}
                onClick={handleSkipCrop}
              >
                {submitting === "skip" ? "چند لحظه..." : "بدون کراپ"}
              </Button>
              <Button
                type="button"
                className="h-12 rounded-[1rem]"
                disabled={!naturalSize.width || !frameSize.width || !frameSize.height || !activeCropRect || submitting !== null}
                onClick={handleApplyCrop}
              >
                {submitting === "crop" ? (
                  <>
                    <LoaderCircle aria-hidden={true} className="h-4 w-4 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Crop aria-hidden={true} className="h-4 w-4" />
                    ثبت کراپ
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
