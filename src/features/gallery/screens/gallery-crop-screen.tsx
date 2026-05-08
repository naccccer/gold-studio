"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { Camera, CheckCircle2, Crop, ImageIcon, LoaderCircle, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyCropToPendingUpload,
  clearPendingGalleryUpload,
  type PendingGalleryUpload,
  usePendingGalleryUpload,
  waitForPendingGalleryUpload,
} from "@/features/gallery/client-upload-store";

type GalleryCropScreenProps = {
  uploadId: string;
  onClose: (options?: { refresh?: boolean }) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function useSquareFrameSize(targetRef: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState(0);

  useEffect(() => {
    const node = targetRef.current;
    if (!node) {
      return;
    }

    const updateSize = () => setSize(node.clientWidth);
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
  frameSize: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const image = await loadPreviewImage(upload.previewUrl);
  const coverScale = Math.max(frameSize / naturalWidth, frameSize / naturalHeight);
  const renderScale = coverScale * zoom;
  const displayedWidth = naturalWidth * renderScale;
  const displayedHeight = naturalHeight * renderScale;
  const left = frameSize / 2 - displayedWidth / 2 + offsetX;
  const top = frameSize / 2 - displayedHeight / 2 + offsetY;

  const sourceX = clamp((0 - left) / renderScale, 0, naturalWidth);
  const sourceY = clamp((0 - top) / renderScale, 0, naturalHeight);
  const sourceSize = Math.min(
    naturalWidth - sourceX,
    naturalHeight - sourceY,
    frameSize / renderScale,
  );

  const outputSize = Math.max(720, Math.round(sourceSize));
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("امکان ساخت خروجی کراپ وجود ندارد.");
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("خروجی کراپ ساخته نشد."));
      }
    }, "image/png");
  });

  const baseName = upload.file.name.replace(/\.[^.]+$/, "") || "gallery-crop";
  return new File([blob], `${baseName}-crop.png`, { type: "image/png" });
}

export function GalleryCropScreen({ uploadId, onClose }: GalleryCropScreenProps) {
  const upload = usePendingGalleryUpload(uploadId);
  const frameRef = useRef<HTMLDivElement>(null);
  const frameSize = useSquareFrameSize(frameRef);
  const dragStateRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [submitting, setSubmitting] = useState<"crop" | "skip" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const status = statusCopy(upload);
  const coverScale = useMemo(() => {
    if (!frameSize || !naturalSize.width || !naturalSize.height) {
      return 0;
    }

    return Math.max(frameSize / naturalSize.width, frameSize / naturalSize.height);
  }, [frameSize, naturalSize.height, naturalSize.width]);

  const displayedWidth = naturalSize.width * coverScale * zoom;
  const displayedHeight = naturalSize.height * coverScale * zoom;
  const limitX = Math.max(0, (displayedWidth - frameSize) / 2);
  const limitY = Math.max(0, (displayedHeight - frameSize) / 2);
  const clampedOffsetX = clamp(offsetX, -limitX, limitX);
  const clampedOffsetY = clamp(offsetY, -limitY, limitY);

  function closeModal(options?: { refresh?: boolean }) {
    if (upload && (upload.status === "failed" || upload.status === "cropped")) {
      clearPendingGalleryUpload(upload.id);
    }

    onClose(options);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!frameSize || !naturalSize.width || !naturalSize.height) {
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

  async function handleSkipCrop() {
    if (!upload) {
      return;
    }

    setSubmitting("skip");
    setLocalError(null);

    try {
      await waitForPendingGalleryUpload(upload.id);
      clearPendingGalleryUpload(upload.id);
      closeModal({ refresh: true });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "بازگشت به گالری بدون کراپ انجام نشد.");
      setSubmitting(null);
    }
  }

  async function handleApplyCrop() {
    if (!upload || !frameSize || !naturalSize.width || !naturalSize.height) {
      return;
    }

    setSubmitting("crop");
    setLocalError(null);

    try {
      const croppedFile = await buildCroppedFile(
        upload,
        naturalSize.width,
        naturalSize.height,
        frameSize,
        zoom,
        clampedOffsetX,
        clampedOffsetY,
      );

      await applyCropToPendingUpload(upload.id, croppedFile);
      clearPendingGalleryUpload(upload.id);
      closeModal({ refresh: true });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "ذخیره کراپ انجام نشد.");
      setSubmitting(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#11100e]/56 px-3 pb-3 pt-8 backdrop-blur-sm md:items-center md:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-crop-title"
        className="grid w-full max-w-[28rem] grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden rounded-[1.7rem] border border-white/15 bg-[linear-gradient(180deg,#f7f2ea_0%,#f2eadf_100%)] shadow-[0_36px_96px_-42px_rgba(0,0,0,0.72)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/6 px-4 pb-3 pt-4 md:px-5">
          <div className="space-y-1.5">
            <p id="gallery-crop-title" className="text-sm font-semibold text-foreground md:text-base">
              کراپ تصویر
            </p>
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

        <div className="min-h-0 overflow-y-auto px-3 pb-3 pt-3 md:px-5 md:pb-4">
          {!upload ? (
            <div className="rounded-[1.25rem] border border-border/70 bg-surface px-4 py-6 text-center">
              <ImageIcon aria-hidden={true} className="mx-auto h-6 w-6 text-muted" />
              <p className="mt-3 text-sm text-foreground">فایل انتخاب شده برای کراپ پیدا نشد.</p>
              <p className="mt-1 text-xs leading-6 text-muted">پنجره را ببندید و دوباره از گالری شروع کنید.</p>
            </div>
          ) : (
            <div className="space-y-3.5 md:space-y-4">
              <section className="rounded-[1.2rem] border border-white/80 bg-white/62 px-3.5 py-3 shadow-[0_16px_34px_-30px_rgba(17,16,14,0.45)]">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#efe2cd] text-[#8b6835]">
                    {upload.source === "camera" ? (
                      <Camera aria-hidden={true} className="h-4.5 w-4.5" />
                    ) : upload.status === "uploading" || upload.status === "saving_crop" ? (
                      <LoaderCircle aria-hidden={true} className="h-4.5 w-4.5 animate-spin" />
                    ) : upload.status === "failed" ? (
                      <UploadCloud aria-hidden={true} className="h-4.5 w-4.5" />
                    ) : (
                      <CheckCircle2 aria-hidden={true} className="h-4.5 w-4.5" />
                    )}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground md:text-base">{status.label}</p>
                    <p className="text-[11px] leading-5 text-muted md:text-xs md:leading-6">{status.description}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.35rem] border border-white/80 bg-[#efe7db] p-2.5 shadow-[0_28px_58px_-46px_rgba(17,16,14,0.32)] md:p-3">
                <div
                  ref={frameRef}
                  className="relative aspect-square overflow-hidden rounded-[1.15rem] bg-[#11100e]"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
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
                  <div className="pointer-events-none absolute inset-3 rounded-[1rem] border border-white/48 shadow-[inset_0_0_0_999px_rgba(0,0,0,0.26)] md:inset-4" />
                  <div className="pointer-events-none absolute inset-3 grid grid-cols-3 grid-rows-3 md:inset-4">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <span key={index} className="border border-white/14" />
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[1.15rem] border border-white/78 bg-white/55 px-3.5 py-3">
                <div className="mb-2.5 flex items-center justify-between text-[11px] font-medium text-muted md:text-xs">
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
                  className="w-full accent-[#c89f61]"
                />
                <p className="mt-2.5 text-[11px] leading-5 text-muted md:leading-6">
                  تصویر را جابه‌جا کنید تا محصول داخل قاب دقیق قرار بگیرد. بعد از تایید، همین نسخه در گالری ذخیره می‌شود.
                </p>
              </section>

              {(localError || upload.error) ? (
                <p className="rounded-[1rem] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                  {localError || upload.error}
                </p>
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
                disabled={!naturalSize.width || !frameSize || submitting !== null}
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
