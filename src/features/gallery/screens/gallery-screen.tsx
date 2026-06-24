"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowRotateLeft,
  ArrowLeft,
  Camera,
  CloseCircle,
  ArrowDown2,
  DocumentUpload,
  Edit2,
  Eye,
  GalleryAdd,
  Magicpen,
  TickCircle,
  Trash,
} from "vuesax-icons-react";
import { Button, ButtonLink, IconButton, buttonClasses } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldControlClassName } from "@/components/ui/field";
import {
  contextMenuDangerItemClasses,
  contextMenuDownloadItemClasses,
  contextMenuItemClasses,
  ItemContextMenu,
} from "@/components/ui/item-context-menu";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import {
  archiveAssetAction,
  renameAssetAction,
  restoreGalleryAssetsAction,
  saveGalleryAssetAsStyleReferenceAction,
} from "@/features/gallery/actions";
import {
  createPendingGalleryUpload,
  discardPendingGalleryUpload,
  startPendingGalleryUpload,
  waitForPendingGalleryUpload,
} from "@/features/gallery/client-upload-store";
import { GalleryCropScreen } from "@/features/gallery/screens/gallery-crop-screen";
import type { StyleOption } from "@/features/projects/presets";
import type { VerticalContent } from "@/lib/vertical-content";

export type GalleryAssetItem = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
  createdAt: Date;
  projects: Array<{ id: string; status: string }>;
};

type GalleryScreenProps = {
  assets: GalleryAssetItem[];
  styles: StyleOption[];
  content: VerticalContent;
  deleteNotice?: "deleted" | "partial" | "archived" | "restored";
  undoAssetIds?: string;
};

const MAX_BATCH_UPLOAD_FILES = 10;
const DELETE_NOTICE_DURATION_MS = 4200;

function scrollGalleryToTop() {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector("[data-ovala-phone-frame]")?.scrollTo({ top: 0, behavior: "smooth" });
  });
}

export function GalleryScreen({ assets, styles, content, deleteNotice, undoAssetIds }: GalleryScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const cropUploadId = searchParams.get("cropUploadId");
  const selectedCount = selectedIds.length;
  const batchHref = `/gallery/batches/new?assetIds=${encodeURIComponent(selectedIds.join(","))}`;
  const undoIds = (undoAssetIds ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  const cropQueueIndex = cropUploadId ? cropQueue.indexOf(cropUploadId) : -1;
  const cropProgressLabel =
    cropUploadId && cropQueueIndex >= 0 && cropQueue.length > 1
      ? `${(cropQueueIndex + 1).toLocaleString("fa-IR")}/${cropQueue.length.toLocaleString("fa-IR")}`
      : undefined;

  useEffect(() => {
    if (!deleteNotice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("deleteNotice");
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `/gallery?${nextQuery}` : "/gallery", { scroll: false });
    }, DELETE_NOTICE_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [deleteNotice, router, searchParams]);

  useEffect(() => {
    if (selectedCount === 0) return;

    function clearOnOutsidePointer(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (
        target.closest(
          "[data-selection-card], [data-selection-controls], [data-item-context-menu], [role='dialog'], input, textarea, select, button, a",
        )
      ) {
        return;
      }

      setSelectedIds([]);
    }

    document.addEventListener("pointerdown", clearOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", clearOnOutsidePointer);
  }, [selectedCount]);

  function toggleAsset(assetId: string) {
    setSelectedIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  }

  function selectAsset(assetId: string) {
    setSelectedIds((current) => (current.includes(assetId) ? current : [...current, assetId]));
  }

  function startAssetHold(assetId: string) {
    longPressTriggeredRef.current = false;
    window.clearTimeout(longPressTimerRef.current ?? undefined);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      selectAsset(assetId);
    }, 460);
  }

  function cancelContextMenuHold() {
    window.clearTimeout(longPressTimerRef.current ?? undefined);
    longPressTimerRef.current = null;
  }

  function ignoreClickAfterLongPress(event: MouseEvent) {
    if (!longPressTriggeredRef.current) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    longPressTriggeredRef.current = false;
    return true;
  }

  function beginCropFlow(files: File[], source: "camera" | "files") {
    if (files.length === 0) {
      return;
    }

    setPickerError(null);

    try {
      const uploadFiles = files.slice(0, MAX_BATCH_UPLOAD_FILES);
      if (files.length > MAX_BATCH_UPLOAD_FILES) {
        setPickerError(`حداکثر ${MAX_BATCH_UPLOAD_FILES.toLocaleString("fa-IR")} عکس در هر نوبت آپلود می‌شود. ${MAX_BATCH_UPLOAD_FILES.toLocaleString("fa-IR")} عکس اول وارد صف شد.`);
      }
      const pendingUploads = uploadFiles.map((file) => createPendingGalleryUpload(file, source));
      pendingUploads.forEach((pendingUpload) => {
        void startPendingGalleryUpload(pendingUpload.id);
      });
      setCropQueue(pendingUploads.map((upload) => upload.id));

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("cropUploadId", pendingUploads[0].id);
      router.push(`/gallery?${nextParams.toString()}`, { scroll: false });
    } catch (error) {
      setPickerError(error instanceof Error ? error.message : "شروع آپلود تصویر ممکن نشد.");
    }
  }

  function selectUploadedAsset(assetId: string, append = false) {
    setSelectedIds((current) => (append ? Array.from(new Set([...current, assetId])) : [assetId]));
  }

  function closeCropOverlay(options?: { refresh?: boolean; selectedAssetId?: string }) {
    const uploadId = cropUploadId;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("cropUploadId");
    const queueIndex = uploadId ? cropQueue.indexOf(uploadId) : -1;
    const nextUploadId = options?.selectedAssetId && queueIndex >= 0 ? cropQueue[queueIndex + 1] : undefined;

    if (options?.selectedAssetId) {
      selectUploadedAsset(options.selectedAssetId, cropQueue.length > 1);
    }

    if (nextUploadId) {
      nextParams.set("cropUploadId", nextUploadId);
      router.replace(`/gallery?${nextParams.toString()}`, { scroll: false });
      router.refresh();
      return;
    }

    if (!options?.selectedAssetId && cropQueue.length > 0) {
      cropQueue.forEach((queuedUploadId) => {
        if (queuedUploadId !== uploadId) {
          void discardPendingGalleryUpload(queuedUploadId);
        }
      });
    }

    setCropQueue([]);
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/gallery?${nextQuery}` : "/gallery", { scroll: false });
    scrollGalleryToTop();

    if (uploadId) {
      void waitForPendingGalleryUpload(uploadId)
        .then((upload) => {
          if (upload.assetId) {
              selectUploadedAsset(upload.assetId);
            }
            router.refresh();
            scrollGalleryToTop();
          })
          .catch(() => undefined);
    }

    if (options?.refresh) {
      router.refresh();
      scrollGalleryToTop();
    }
  }

  return (
    <>
      <PageShell maxWidth="lg" className="space-y-5 pb-[12.5rem]">
        <div className="flex flex-col gap-5">
        {deleteNotice ? (
          <div className="relative overflow-hidden rounded-[1rem] border border-accent/24 bg-accent-wash/76 px-3 py-2 text-sm leading-6 text-accent-deep animate-[ovalaNoticeSlot_4.2s_ease-in-out_forwards]">
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1">
                {deleteNotice === "restored" ? "عکس به گالری برگشت." : "عکس از گالری حذف شد."}
              </p>
              {undoIds.length > 0 ? (
                <form action={restoreGalleryAssetsAction} className="shrink-0">
                  {undoIds.map((id) => (
                    <input key={id} type="hidden" name="assetId" value={id} />
                  ))}
                  <button
                    type="submit"
                    aria-label="برگرداندن عکس به گالری"
                    className="motion-press inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/24 bg-surface/72 text-accent-deep shadow-[0_10px_20px_-18px_rgba(17,16,14,0.55)] backdrop-blur"
                  >
                    <ArrowRotateLeft aria-hidden={true} className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : null}
            </div>
            <span className="absolute inset-x-0 bottom-0 h-0.5 origin-right animate-[ovalaNoticeProgress_4.2s_linear_forwards] bg-accent-bright/70" />
          </div>
        ) : null}

        {pickerError ? (
          <p className="motion-state rounded-[1rem] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {pickerError}
          </p>
        ) : null}

        {assets.length === 0 ? (
          <EmptyState
            title={content.galleryEmptyTitle}
            className="pt-2"
            media={
              <Image
                src={content.placeholders.uploadPreview.src}
                alt={content.placeholders.uploadPreview.alt}
                fill
                priority
                className="object-cover object-[46%_55%]"
                sizes="(max-width: 768px) 100vw, 680px"
              />
            }
          />
        ) : (
          <section className="grid grid-cols-2 gap-3">
            {assets.map((asset) => {
              const selected = selectedIds.includes(asset.id);
              const title = asset.title || asset.originalName || content.galleryImageFallbackTitle;

              return (
                <article key={asset.id} className="relative" data-selection-card>
                  <button
                    type="button"
                    onPointerDown={() => startAssetHold(asset.id)}
                    onPointerUp={cancelContextMenuHold}
                    onPointerLeave={cancelContextMenuHold}
                    onPointerCancel={cancelContextMenuHold}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      selectAsset(asset.id);
                    }}
                    onClick={(event) => {
                      if (ignoreClickAfterLongPress(event)) {
                        return;
                      }

                      if (selectedCount > 0) {
                        toggleAsset(asset.id);
                        return;
                      }

                      selectAsset(asset.id);
                    }}
                    aria-label={`انتخاب ${title}`}
                    className="block w-full select-none text-right [touch-action:manipulation] [-webkit-touch-callout:none]"
                  >
                    <JewelryImageFrame aspect="gallery" selected={selected} className="rounded-[var(--radius-lg)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.fileUrl} alt={title} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/68 via-black/24 via-38% to-transparent px-2.5 pb-1.5 pt-5">
                        <div
                          className="absolute inset-x-0 bottom-0 z-0 h-14 bg-black/12 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.72)_34%,transparent_100%)]"
                          aria-hidden={true}
                        />
                        <p className="relative z-10 flex min-h-11 items-center truncate pl-12 text-xs font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                          {title}
                        </p>
                        <p className="hidden">
                          {asset.projects.length > 0
                            ? `${asset.projects.length.toLocaleString("fa-IR")} پروژه`
                            : "آماده برای ساخت"}
                        </p>
                      </div>
                      {selected ? (
                        <>
                          <span aria-hidden={true} className="absolute inset-0 bg-accent-bright/18" />
                          <span className="motion-reveal-soft absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-surface shadow-[0_12px_24px_-14px_rgba(0,0,0,0.85)]">
                            <TickCircle aria-hidden={true} className="h-4.5 w-4.5" />
                          </span>
                        </>
                      ) : null}
                    </JewelryImageFrame>
                  </button>
                  <div className="absolute bottom-1.5 left-1.5">
                    <ItemContextMenu label={`منوی ${title}`} align="right">
                      <button type="button" onClick={() => toggleAsset(asset.id)} className={contextMenuItemClasses} data-close-context-menu>
                        <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                        {selected ? "لغو انتخاب" : "انتخاب"}
                      </button>
                      <Link href={`/gallery/${asset.id}`} className={contextMenuItemClasses}>
                        <Eye aria-hidden={true} className="h-3.5 w-3.5" />
                        مشاهده جزئیات
                      </Link>
                      <Link href={`/projects/new?assetId=${asset.id}`} className={contextMenuItemClasses}>
                        <Magicpen aria-hidden={true} className="h-3.5 w-3.5" />
                        ساخت پروژه
                      </Link>
                      <a href={asset.fileUrl} download className={contextMenuDownloadItemClasses}>
                        <ArrowDown2 aria-hidden={true} className="h-3.5 w-3.5 stroke-[2.3]" />
                        دانلود عکس
                      </a>
                      <form action={saveGalleryAssetAsStyleReferenceAction}>
                        <input type="hidden" name="assetId" value={asset.id} />
                        <button type="submit" className={contextMenuItemClasses}>
                          <GalleryAdd aria-hidden={true} className="h-3.5 w-3.5" />
                          {content.gallerySaveReferenceLabel}
                        </button>
                      </form>
                      <form action={renameAssetAction} className="space-y-1.5 px-1 py-1.5">
                        <input type="hidden" name="assetId" value={asset.id} />
                        <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                          <Edit2 aria-hidden={true} className="h-3.5 w-3.5" />
                          تغییر نام
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            name="title"
                            defaultValue={title}
                            maxLength={80}
                            className={`${fieldControlClassName} min-h-9 flex-1 px-2 text-xs`}
                          />
                          <button
                            type="submit"
                            className={buttonClasses({
                              size: "sm",
                              className: "min-h-9 rounded-[var(--radius-sm)] px-2.5 text-xs",
                            })}
                          >
                            ثبت
                          </button>
                        </div>
                      </form>
                      <ConfirmAction
                        action={archiveAssetAction}
                        fields={[{ name: "assetId", value: asset.id }]}
                        title="آیا از حذف عکس مطمئنید؟"
                        trigger={(open) => (
                          <button type="button" onClick={open} className={contextMenuDangerItemClasses}>
                            <Trash aria-hidden={true} className="h-3.5 w-3.5" />
                            حذف
                          </button>
                        )}
                      />
                    </ItemContextMenu>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        </div>
      </PageShell>

      <section
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.85rem)] z-30 mx-auto w-full max-w-[393px] px-4 md:max-w-[425px]"
        data-selection-controls
      >
        {selectedCount === 0 ? (
          <div className="pointer-events-auto grid grid-cols-2 gap-3 rounded-[1.25rem] border border-dashed border-accent/58 bg-surface/95 p-3 shadow-[0_18px_42px_-30px_rgba(17,16,14,0.32)] backdrop-blur">
            <label htmlFor="gallery-file-input" className={buttonClasses({ className: "h-12 w-full rounded-[1rem]" })}>
              <DocumentUpload aria-hidden={true} className="h-4 w-4" />
              {content.galleryUploadLabel}
            </label>
            <label
              htmlFor="gallery-camera-input"
              className={buttonClasses({ variant: "secondary", className: "h-12 w-full rounded-[1rem]" })}
            >
              <Camera aria-hidden={true} className="h-4 w-4" />
              {content.galleryCameraLabel}
            </label>
          </div>
        ) : (
          <div className="pointer-events-auto grid grid-cols-[2.75rem_4rem_minmax(0,1fr)] items-center gap-3 rounded-[1.25rem] border border-border/65 bg-surface/96 p-3 shadow-[0_18px_42px_-30px_rgba(17,16,14,0.42)] backdrop-blur">
            <ConfirmAction
              action={archiveAssetAction}
              fields={selectedIds.map((id) => ({ name: "assetId", value: id }))}
              title={selectedCount === 1 ? "آیا از حذف عکس مطمئنید؟" : "آیا از حذف عکس‌ها مطمئنید؟"}
              trigger={(open) => (
                <IconButton type="button" onClick={open} label="حذف" variant="danger" className="h-11 w-11">
                  <Trash aria-hidden={true} className="h-4 w-4" />
                </IconButton>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-11 w-full rounded-full border border-foreground/18 bg-surface text-xs font-bold text-foreground shadow-[0_12px_24px_-20px_rgba(17,16,14,0.68)] hover:bg-surface-soft"
            >
              <CloseCircle aria-hidden={true} className="h-4 w-4" />
              لغو
            </Button>
            <ButtonLink href={selectedCount === 1 ? `/projects/new?assetId=${selectedIds[0]}` : styles.length > 0 ? batchHref : "/gallery"} className="h-12 w-full rounded-[1rem]">
              {selectedCount === 1 ? (
                <>
                  ادامه
                  <ArrowLeft aria-hidden={true} className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="sr-only">{selectedCount.toLocaleString("fa-IR")} تصویر انتخاب شده</span>
                  <Magicpen aria-hidden={true} className="h-4 w-4" />
                  ساخت گروهی
                </>
              )}
            </ButtonLink>
          </div>
        )}
      </section>

      <input
        id="gallery-camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          beginCropFlow(file ? [file] : [], "camera");
          event.currentTarget.value = "";
        }}
      />
      <input
        id="gallery-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          beginCropFlow(Array.from(event.target.files ?? []), "files");
          event.currentTarget.value = "";
        }}
      />

      {cropUploadId ? <GalleryCropScreen key={cropUploadId} uploadId={cropUploadId} progressLabel={cropProgressLabel} onClose={closeCropOverlay} /> : null}
    </>
  );
}
