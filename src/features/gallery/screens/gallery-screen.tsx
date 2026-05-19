"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Camera,
  CloseCircle,
  DocumentDownload,
  DocumentUpload,
  Edit2,
  Eye,
  Magicpen,
  TickCircle,
  Trash,
} from "vuesax-icons-react";
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
  const selectedCount = selectedIds.length;

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
    <>
      <PageShell maxWidth="lg" className="space-y-5 pb-[12.5rem]">
        <div className="flex flex-col gap-5">
        {pickerError ? (
          <p className="motion-state rounded-[1rem] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {pickerError}
          </p>
        ) : null}

        {assets.length === 0 ? (
          <EmptyState
            title="هنوز عکسی در گالری ندارید."
            className="pt-2"
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
                        <span className="motion-reveal-soft absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-surface">
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

        {selectedCount > 0 ? (
          <ActionDock sticky className={selectedCount > 0 ? "!grid-cols-[2.75rem_4rem_minmax(0,1fr)] items-center" : ""}>
            {selectedCount === 1 ? (
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="h-11 w-full rounded-full border border-foreground/18 bg-surface text-xs font-bold text-foreground shadow-[0_12px_24px_-20px_rgba(17,16,14,0.68)] hover:bg-surface-soft"
                >
                  <CloseCircle aria-hidden={true} className="h-4 w-4" />
                  لغو
                </Button>
                <ButtonLink href={`/projects/new?assetId=${selectedIds[0]}`} className="h-12 w-full rounded-[1rem]">
                  ادامه به پروژه
                  <ArrowLeft aria-hidden={true} className="h-4 w-4" />
                </ButtonLink>
              </>
            ) : (
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="h-11 w-full rounded-full border border-foreground/18 bg-surface text-xs font-bold text-foreground shadow-[0_12px_24px_-20px_rgba(17,16,14,0.68)] hover:bg-surface-soft"
                >
                  <CloseCircle aria-hidden={true} className="h-4 w-4" />
                  لغو
                </Button>
                <form action={batchAction}>
                  {selectedIds.map((id) => (
                    <input key={id} type="hidden" name="assetIds" value={id} />
                  ))}
                  <input type="hidden" name="styleId" value={styles[0]?.id ?? ""} />
                  <input type="hidden" name="outputPreset" value="post" />
                  <Button type="submit" className="h-12 w-full rounded-[1rem]">
                    <Magicpen aria-hidden={true} className="h-4 w-4" />
                    ساخت گروهی
                  </Button>
                </form>
              </>
            )}
          </ActionDock>
        ) : null}
        </div>
      </PageShell>

      {selectedCount === 0 ? (
        <section className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.9rem)] z-30 mx-auto w-full max-w-[393px] px-4 md:max-w-[425px]">
          <div className="pointer-events-auto grid grid-cols-2 gap-3 rounded-[1.25rem] border border-dashed border-accent/58 bg-surface/95 p-3 shadow-[0_18px_42px_-30px_rgba(17,16,14,0.32)] backdrop-blur">
            <label htmlFor="gallery-file-input" className={buttonClasses({ className: "h-12 w-full rounded-[1rem]" })}>
              <DocumentUpload aria-hidden={true} className="h-4 w-4" />
              آپلود عکس
            </label>
            <label
              htmlFor="gallery-camera-input"
              className={buttonClasses({ variant: "secondary", className: "h-12 w-full rounded-[1rem]" })}
            >
              <Camera aria-hidden={true} className="h-4 w-4" />
              دوربین
            </label>
          </div>
        </section>
      ) : null}

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

      {cropUploadId ? <GalleryCropScreen uploadId={cropUploadId} onClose={closeCropOverlay} /> : null}
    </>
  );
}
