"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, DocumentDownload, DocumentUpload, Edit2, Eye, Magicpen, TickCircle, Trash } from "vuesax-icons-react";
import { useState } from "react";
import { ActionDock } from "@/components/ui/action-dock";
import { Button, ButtonLink, IconButton, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldControlClassName } from "@/components/ui/field";
import {
  contextMenuDangerItemClasses,
  contextMenuItemClasses,
  ItemContextMenu,
} from "@/components/ui/item-context-menu";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { archiveAssetAction, renameAssetAction } from "@/features/gallery/actions";
import {
  createPendingGalleryUpload,
  startPendingGalleryUpload,
  waitForPendingGalleryUpload,
} from "@/features/gallery/client-upload-store";
import { GalleryCropScreen } from "@/features/gallery/screens/gallery-crop-screen";
import type { StyleOption } from "@/features/projects/presets";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";

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
  batchAction: (formData: FormData) => Promise<void>;
};

export function GalleryScreen({ assets, styles, batchAction }: GalleryScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const cropUploadId = searchParams.get("cropUploadId");

  function toggleAsset(assetId: string) {
    setSelectedIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  }

  function beginCropFlow(file: File | null, source: "camera" | "files") {
    if (!file) {
      return;
    }

    setPickerError(null);

    try {
      const pendingUpload = createPendingGalleryUpload(file, source);
      void startPendingGalleryUpload(pendingUpload.id);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("cropUploadId", pendingUpload.id);
      router.push(`/gallery?${nextParams.toString()}`, { scroll: false });
    } catch (error) {
      setPickerError(error instanceof Error ? error.message : "شروع آپلود تصویر ممکن نشد.");
    }
  }

  function closeCropOverlay(options?: { refresh?: boolean }) {
    const uploadId = cropUploadId;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("cropUploadId");
    const nextQuery = nextParams.toString();

    router.replace(nextQuery ? `/gallery?${nextQuery}` : "/gallery", { scroll: false });

    if (options?.refresh) {
      router.refresh();
      return;
    }

    if (uploadId) {
      void waitForPendingGalleryUpload(uploadId)
        .then(() => {
          router.refresh();
        })
        .catch(() => undefined);
    }
  }

  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-32">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-5">
        <section className="rounded-[1.15rem] border border-dashed border-accent/62 bg-surface/52 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-[#7b7164]">عکس محصول را اضافه کن</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label
                htmlFor="gallery-camera-input"
                className={buttonClasses({ variant: "secondary", size: "icon", className: "rounded-full bg-accent-wash text-accent-deep" })}
                aria-label="باز کردن دوربین"
              >
                <Camera aria-hidden={true} className="h-5 w-5" />
              </label>
              <label
                htmlFor="gallery-file-input"
                className={buttonClasses({ variant: "secondary", size: "icon", className: "rounded-full bg-accent-wash text-accent-deep" })}
                aria-label="باز کردن فایل‌ها"
              >
                <DocumentUpload aria-hidden={true} className="h-5 w-5" />
              </label>
            </div>
          </div>

          <input
            id="gallery-camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              beginCropFlow(event.target.files?.[0] ?? null, "camera");
              event.currentTarget.value = "";
            }}
          />
          <input
            id="gallery-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              beginCropFlow(event.target.files?.[0] ?? null, "files");
              event.currentTarget.value = "";
            }}
          />
        </section>

        {pickerError ? (
          <p className="rounded-[1rem] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {pickerError}
          </p>
        ) : null}

        {assets.length === 0 ? (
          <EmptyState
            title="هنوز عکسی در گالری نیست."
            media={
              <Image
                src={uploadPreview.src}
                alt={uploadPreview.alt}
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
              const title = asset.title || asset.originalName || "تصویر محصول";

              return (
                <article key={asset.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleAsset(asset.id)}
                    aria-label={`انتخاب ${title}`}
                    className="block w-full text-right"
                  >
                    <JewelryImageFrame aspect="landscape" selected={selected} className="rounded-[var(--radius-lg)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.fileUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                      {selected ? (
                        <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-surface">
                          <TickCircle aria-hidden={true} className="h-4 w-4" />
                        </span>
                      ) : null}
                    </JewelryImageFrame>
                  </button>
                  <div className="absolute bottom-1.5 left-1.5">
                    <ItemContextMenu label={`منوی ${title}`} align="right">
                      <Link href={`/gallery/${asset.id}`} className={contextMenuItemClasses}>
                        <Eye aria-hidden={true} className="h-3.5 w-3.5" />
                        مشاهده جزئیات
                      </Link>
                      <Link href={`/projects/new?assetId=${asset.id}`} className={contextMenuItemClasses}>
                        <Magicpen aria-hidden={true} className="h-3.5 w-3.5" />
                        ساخت پروژه
                      </Link>
                      <a href={asset.fileUrl} download className={contextMenuItemClasses}>
                        <DocumentDownload aria-hidden={true} className="h-3.5 w-3.5" />
                        دانلود عکس
                      </a>
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
                          <button type="submit" className={buttonClasses({ size: "sm", className: "min-h-9 rounded-[var(--radius-sm)] px-2.5 text-xs" })}>
                            ثبت
                          </button>
                        </div>
                      </form>
                      <form
                        action={archiveAssetAction}
                        onSubmit={(event) => {
                          if (!window.confirm("این عکس به آرشیو می‌رود و بعد از ۱۴ روز حذف کامل می‌شود. ادامه می‌دهید؟")) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="assetId" value={asset.id} />
                        <button type="submit" className={contextMenuDangerItemClasses}>
                          <Trash aria-hidden={true} className="h-3.5 w-3.5" />
                          حذف
                        </button>
                      </form>
                    </ItemContextMenu>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <ActionDock sticky className={selectedIds.length > 0 ? "!grid-cols-[2.25rem_minmax(0,1fr)] items-center" : ""}>
          {selectedIds.length === 1 ? (
            <>
              <form
                action={archiveAssetAction}
                onSubmit={(event) => {
                  if (!window.confirm("آیتم انتخاب‌شده به آرشیو می‌رود و بعد از ۱۴ روز حذف کامل می‌شود. ادامه می‌دهید؟")) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="assetId" value={selectedIds[0]} />
                <IconButton type="submit" label="حذف" variant="danger" className="h-11 w-11">
                  <Trash aria-hidden={true} className="h-4 w-4" />
                </IconButton>
              </form>
              <ButtonLink href={`/projects/new?assetId=${selectedIds[0]}`} className="col-span-1 h-12 w-full rounded-[1rem]">
                ادامه
                <ArrowLeft aria-hidden={true} className="h-4 w-4" />
              </ButtonLink>
            </>
          ) : selectedIds.length > 1 ? (
            <>
              <form
                action={archiveAssetAction}
                onSubmit={(event) => {
                  if (!window.confirm("آیتم‌های انتخاب‌شده به آرشیو می‌روند و بعد از ۱۴ روز حذف کامل می‌شوند. ادامه می‌دهید؟")) {
                    event.preventDefault();
                  }
                }}
              >
                {selectedIds.map((id) => (
                  <input key={id} type="hidden" name="assetId" value={id} />
                ))}
                <IconButton type="submit" label="حذف" variant="danger" className="h-11 w-11">
                  <Trash aria-hidden={true} className="h-4 w-4" />
                </IconButton>
              </form>
              <form action={batchAction}>
                {selectedIds.map((id) => (
                  <input key={id} type="hidden" name="assetIds" value={id} />
                ))}
                <input type="hidden" name="styleId" value={styles[0]?.id ?? ""} />
                <input type="hidden" name="outputPreset" value="post" />
                <Button type="submit" className="h-12 w-full rounded-[1rem]">
                  <Magicpen aria-hidden={true} className="h-4 w-4" />
                  ادامه
                </Button>
              </form>
            </>
          ) : (
            <Button type="button" size="full" className="h-12 rounded-[1rem]" disabled>
              ادامه
            </Button>
          )}
        </ActionDock>
      </div>

      {cropUploadId ? <GalleryCropScreen uploadId={cropUploadId} onClose={closeCropOverlay} /> : null}
    </PageShell>
  );
}
