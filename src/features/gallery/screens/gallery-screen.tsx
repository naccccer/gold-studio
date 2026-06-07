"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Camera,
  Upload,
  Trash2,
  Eye,
  Download,
  ImagePlus,
  Pencil,
  Sparkles,
  CheckCircle2,
  ImageOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink, IconButton, buttonClasses } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldControlClassName } from "@/components/ui/field";
import { ImageFrame } from "@/components/ui/image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { ItemContextMenu, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/item-context-menu";
import { GalleryCropScreen } from "@/features/gallery/screens/gallery-crop-screen";
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
import type { StyleOption } from "@/features/projects/presets";

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
  deleteNotice?: "deleted" | "partial" | "archived" | "restored";
  undoAssetIds?: string;
};

const MAX_BATCH_UPLOAD_FILES = 10;

export function GalleryScreen({ assets, styles, deleteNotice, undoAssetIds }: GalleryScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
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
    if (!deleteNotice) return;
    const messages: Record<typeof deleteNotice, string> = {
      deleted: "عکس از گالری حذف شد.",
      partial: "برخی عکس‌ها حذف شدند.",
      archived: "به آرشیو منتقل شد.",
      restored: "عکس به گالری برگشت.",
    };
    toast(messages[deleteNotice], {
      action: undoIds.length > 0
        ? {
            label: "برگرداندن",
            onClick: () => {
              const form = new FormData();
              undoIds.forEach((id) => form.append("assetId", id));
              void restoreGalleryAssetsAction(form);
            },
          }
        : undefined,
    });
  }, [deleteNotice, undoIds]);

  function toggleAsset(assetId: string) {
    setSelectedIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  }

  function beginCropFlow(files: File[], source: "camera" | "files") {
    if (files.length === 0) return;
    setPickerError(null);
    try {
      const uploadFiles = files.slice(0, MAX_BATCH_UPLOAD_FILES);
      if (files.length > MAX_BATCH_UPLOAD_FILES) {
        setPickerError(`حداکثر ${MAX_BATCH_UPLOAD_FILES.toLocaleString("fa-IR")} عکس در هر نوبت آپلود می‌شود.`);
        toast.warning(`فقط ${MAX_BATCH_UPLOAD_FILES.toLocaleString("fa-IR")} عکس اول وارد صف شد.`);
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
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (uploadId) {
      void waitForPendingGalleryUpload(uploadId)
        .then((upload) => {
          if (upload.assetId) selectUploadedAsset(upload.assetId);
          router.refresh();
        })
        .catch(() => undefined);
    }

    if (options?.refresh) {
      router.refresh();
    }
  }

  return (
    <>
      <PageShell maxWidth="phone" className="space-y-4 pb-[8.5rem]">
        {pickerError ? (
          <div className="rounded-[var(--r-md)] border border-danger/20 bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {pickerError}
          </div>
        ) : null}

        {assets.length === 0 ? (
          <EmptyState
            icon={<ImageOff className="h-6 w-6" strokeWidth={1.8} />}
            title="گالری شما خالی است"
            description="برای شروع، عکس محصول را از گالری گوشی یا دوربین اضافه کنید."
            action={
              <div className="grid w-full grid-cols-2 gap-2">
                <label htmlFor="gallery-file-input" className={buttonClasses({ size: "md", className: "h-12" })}>
                  <Upload aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                  آپلود عکس
                </label>
                <label htmlFor="gallery-camera-input" className={buttonClasses({ variant: "secondary", size: "md", className: "h-12" })}>
                  <Camera aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                  دوربین
                </label>
              </div>
            }
            className="py-12"
          />
        ) : (
          <section className="grid grid-cols-2 gap-3">
            {assets.map((asset) => {
              const selected = selectedIds.includes(asset.id);
              const title = asset.title || asset.originalName || "تصویر محصول";
              const projectsCount = asset.projects.length;
              return (
                <article key={asset.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleAsset(asset.id)}
                    aria-label={`انتخاب ${title}`}
                    aria-pressed={selected}
                    className="group block w-full text-right"
                  >
                    <ImageFrame
                      aspect="gallery"
                      tone="photo"
                      selected={selected}
                      radius="lg"
                      className="border-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.fileUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-[var(--d-slow)] group-hover:scale-[1.02]"
                      />
                      {selected ? (
                        <span className="absolute left-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-[var(--r-pill)] bg-ink-1 text-surface shadow-[var(--shadow-md)]">
                          <CheckCircle2 aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-1/68 to-transparent p-2.5 pt-6">
                        <p className="truncate text-[12px] font-semibold text-surface">{title}</p>
                        <p className="mt-0.5 text-[10px] text-surface/72">
                          {projectsCount > 0
                            ? `${projectsCount.toLocaleString("fa-IR")} پروژه`
                            : "آماده برای ساخت"}
                        </p>
                      </div>
                    </ImageFrame>
                  </button>
                  <div className="absolute bottom-2 left-2">
                    <ItemContextMenu label={`منوی ${title}`} align="end" size="sm">
                      <ContextMenuItem>
                        <Link href={`/gallery/${asset.id}`} className="flex w-full items-center gap-2">
                          <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                          مشاهده جزئیات
                        </Link>
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <Link href={`/projects/new?assetId=${asset.id}`} className="flex w-full items-center gap-2">
                          <Sparkles aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                          ساخت پروژه
                        </Link>
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <a href={asset.fileUrl} download className="flex w-full items-center gap-2">
                          <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                          دانلود عکس
                        </a>
                      </ContextMenuItem>
                      <form action={saveGalleryAssetAsStyleReferenceAction}>
                        <input type="hidden" name="assetId" value={asset.id} />
                        <ContextMenuItem>
                          <span className="flex w-full items-center gap-2">
                            <ImagePlus aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                            ذخیره در نمونه‌ها
                          </span>
                        </ContextMenuItem>
                      </form>
                      <ContextMenuSeparator />
                      <form action={renameAssetAction} className="space-y-1.5 p-1.5">
                        <input type="hidden" name="assetId" value={asset.id} />
                        <label className="flex items-center gap-1.5 text-[11px] font-medium text-ink-3">
                          <Pencil aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                          تغییر نام
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            name="title"
                            defaultValue={title}
                            maxLength={80}
                            className={`${fieldControlClassName} h-9 flex-1 px-2 text-xs`}
                          />
                          <button
                            type="submit"
                            className={buttonClasses({ size: "sm", className: "h-9 rounded-[var(--r-sm)] px-2.5 text-xs" })}
                          >
                            ثبت
                          </button>
                        </div>
                      </form>
                      <ContextMenuSeparator />
                      <ConfirmAction
                        action={archiveAssetAction}
                        fields={[{ name: "assetId", value: asset.id }]}
                        title="آیا از حذف عکس مطمئنید؟"
                        trigger={
                          <button type="button" className="flex w-full items-center gap-2 rounded-[var(--r-sm)] px-3 py-2 text-[13px] font-semibold text-danger hover:bg-danger-soft">
                            <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                            حذف
                          </button>
                        }
                      />
                    </ItemContextMenu>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </PageShell>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.85rem)] z-30 mx-auto w-full max-w-[420px] px-[var(--page-x)]">
        {selectedCount === 0 ? (
          <div className="pointer-events-auto grid grid-cols-2 gap-2 rounded-[var(--r-xl)] border border-border-hairline bg-surface/90 p-2 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <label htmlFor="gallery-file-input" className={buttonClasses({ size: "md", className: "h-12 rounded-[var(--r-lg)]" })}>
              <Upload aria-hidden className="h-4 w-4" strokeWidth={2.2} />
              آپلود عکس
            </label>
            <label htmlFor="gallery-camera-input" className={buttonClasses({ variant: "secondary", size: "md", className: "h-12 rounded-[var(--r-lg)]" })}>
              <Camera aria-hidden className="h-4 w-4" strokeWidth={2.2} />
              دوربین
            </label>
          </div>
        ) : (
          <div className="pointer-events-auto flex items-center gap-2 rounded-[var(--r-xl)] border border-border-hairline bg-surface/95 p-2 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <ConfirmAction
              action={archiveAssetAction}
              fields={selectedIds.map((id) => ({ name: "assetId", value: id }))}
              title={selectedCount === 1 ? "آیا از حذف عکس مطمئنید؟" : "آیا از حذف عکس‌ها مطمئنید؟"}
              trigger={
                <IconButton label="حذف" variant="danger" className="h-12 w-12 rounded-[var(--r-lg)]">
                  <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                </IconButton>
              }
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-12 flex-1 rounded-[var(--r-lg)] border border-border bg-surface text-[13px] font-semibold text-ink-1 hover:bg-surface-soft"
            >
              <X aria-hidden className="h-4 w-4" strokeWidth={2.2} />
              لغو
            </Button>
            <ButtonLink
              href={selectedCount === 1 ? `/projects/new?assetId=${selectedIds[0]}` : styles.length > 0 ? batchHref : "/gallery"}
              className="h-12 flex-1 rounded-[var(--r-lg)]"
            >
              {selectedCount === 1 ? (
                <>ادامه</>
              ) : (
                <>
                  <span className="sr-only">{selectedCount.toLocaleString("fa-IR")} تصویر انتخاب شده</span>
                  <Sparkles aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                  ساخت گروهی
                </>
              )}
            </ButtonLink>
          </div>
        )}
      </div>

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
