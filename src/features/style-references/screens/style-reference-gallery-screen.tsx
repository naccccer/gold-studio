"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CloseCircle, DocumentUpload, Edit2, Gallery, TickCircle, Trash } from "vuesax-icons-react";
import { buttonClasses, Button, IconButton } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldControlClassName } from "@/components/ui/field";
import {
  contextMenuItemClasses,
  contextMenuDangerItemClasses,
  ItemContextMenu,
} from "@/components/ui/item-context-menu";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import {
  archiveStyleReferenceAction,
  createStyleReferenceFromSampleAction,
  renameStyleReferenceAction,
  uploadStyleReferenceAction,
} from "@/features/style-references/actions";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";

export type StyleReferenceGalleryItem = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
  createdAt: Date;
};

export type StyleReferenceEmptySample = {
  id: string;
  fileUrl: string;
  title: string;
};

type StyleReferenceGalleryScreenProps = {
  assets: StyleReferenceGalleryItem[];
  emptySamples?: StyleReferenceEmptySample[];
  error?: string | null;
};

function assetTitle(asset: StyleReferenceGalleryItem) {
  return asset.title || asset.originalName || "عکس نمونه";
}

export function StyleReferenceGalleryScreen({ assets, emptySamples = [], error }: StyleReferenceGalleryScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
  const [hiddenSampleIds, setHiddenSampleIds] = useState<string[]>([]);
  const [previewSample, setPreviewSample] = useState<StyleReferenceEmptySample | null>(null);
  const fileFormRef = useRef<HTMLFormElement>(null);
  const cameraFormRef = useRef<HTMLFormElement>(null);
  const selectedCount = selectedIds.length;
  const visibleEmptySamples = emptySamples.filter((sample) => !hiddenSampleIds.includes(sample.id));

  useEffect(() => {
    if (!previewSample) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewSample(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [previewSample]);

  function toggleAsset(assetId: string) {
    setSelectedIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  }

  function toggleReadySample(sampleId: string) {
    setSelectedSampleIds((current) =>
      current.includes(sampleId) ? current.filter((id) => id !== sampleId) : [...current, sampleId],
    );
  }

  function hideReadySample(sampleId: string) {
    setSelectedSampleIds((current) => current.filter((id) => id !== sampleId));
    setHiddenSampleIds((current) => current.includes(sampleId) ? current : [...current, sampleId]);
  }

  return (
    <>
      <PageShell maxWidth="lg" className="space-y-5 pb-[12.5rem]">
        <header className="flex items-center gap-3 px-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
              <Gallery aria-hidden={true} className="h-4.5 w-4.5" />
            </span>
            <h1 className="truncate text-base font-semibold text-foreground">گالری نمونه‌ها</h1>
          </div>
        </header>

        {error ? (
          <p className="rounded-[1rem] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {assets.length === 0 && visibleEmptySamples.length === 0 ? (
          <section className="space-y-4">
            <EmptyState
              title="هنوز عکس نمونه‌ای ندارید."
              className="pt-2"
              media={
                // eslint-disable-next-line @next/next/no-img-element
                <img src={uploadPreview.src} alt={uploadPreview.alt} className="h-full w-full object-cover object-[46%_55%]" />
              }
            />
          </section>
        ) : (
          <section className="grid grid-cols-3 gap-2">
            {assets.map((asset) => {
              const selected = selectedIds.includes(asset.id);
              const title = assetTitle(asset);

              return (
                <article key={asset.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleAsset(asset.id)}
                    aria-label={`انتخاب ${title}`}
                    className="block w-full text-right"
                  >
                    <JewelryImageFrame aspect="square" treatment="quiet" selected={selected} className="rounded-[0.9rem]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.fileUrl} alt={title} className="h-full w-full object-cover" />
                      {selected ? (
                        <span className="absolute left-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                          <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </JewelryImageFrame>
                  </button>
                  <div className="absolute left-1 top-1">
                    <ItemContextMenu label={`منوی ${title}`} align="right" size="sm">
                      <button type="button" onClick={() => toggleAsset(asset.id)} className={contextMenuItemClasses}>
                        <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                        {selected ? "لغو انتخاب" : "انتخاب"}
                      </button>
                      <form action={renameStyleReferenceAction} className="space-y-1.5 px-1 py-1.5">
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
                        action={archiveStyleReferenceAction}
                        fields={[{ name: "assetId", value: asset.id }]}
                        title="آیا از حذف عکس نمونه مطمئنید؟"
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
            {visibleEmptySamples.map((sample) => {
              const selected = selectedSampleIds.includes(sample.id);

              return (
                <article key={sample.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setPreviewSample(sample)}
                    aria-label={`مشاهده ${sample.title}`}
                    className="block w-full text-right"
                  >
                    <JewelryImageFrame aspect="square" treatment="quiet" selected={selected} className="rounded-[0.9rem]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sample.fileUrl} alt={sample.title} className="h-full w-full object-cover" />
                      {selected ? (
                        <span className="absolute left-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-surface">
                          <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </JewelryImageFrame>
                  </button>
                  <div className="absolute left-1 top-1">
                    <ItemContextMenu label={`منوی ${sample.title}`} align="right" size="sm">
                      <button type="button" onClick={() => setPreviewSample(sample)} className={contextMenuItemClasses}>
                        <Camera aria-hidden={true} className="h-3.5 w-3.5" />
                        مشاهده
                      </button>
                      <button type="button" onClick={() => toggleReadySample(sample.id)} className={contextMenuItemClasses}>
                        <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                        {selected ? "لغو انتخاب" : "انتخاب"}
                      </button>
                      <form action={createStyleReferenceFromSampleAction}>
                        <input type="hidden" name="sampleId" value={sample.id} />
                        <button type="submit" className={contextMenuItemClasses}>
                          <DocumentUpload aria-hidden={true} className="h-3.5 w-3.5" />
                          تولید با این نمونه
                        </button>
                      </form>
                      <button type="button" onClick={() => hideReadySample(sample.id)} className={contextMenuDangerItemClasses}>
                        <Trash aria-hidden={true} className="h-3.5 w-3.5" />
                        حذف از این لیست
                      </button>
                    </ItemContextMenu>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </PageShell>

      <section className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.85rem)] z-30 mx-auto w-full max-w-[393px] px-4 md:max-w-[425px]">
        {selectedCount === 0 ? (
          <div className="pointer-events-auto grid grid-cols-2 gap-3 rounded-[1.25rem] border border-dashed border-accent/58 bg-surface/95 p-3 shadow-[0_18px_42px_-30px_rgba(17,16,14,0.32)] backdrop-blur">
            <label htmlFor="style-reference-file-input" className={buttonClasses({ className: "h-12 w-full rounded-[1rem]" })}>
              <DocumentUpload aria-hidden={true} className="h-4 w-4" />
              آپلود نمونه
            </label>
            <label
              htmlFor="style-reference-camera-input"
              className={buttonClasses({ variant: "secondary", className: "h-12 w-full rounded-[1rem]" })}
            >
              <Camera aria-hidden={true} className="h-4 w-4" />
              دوربین
            </label>
          </div>
        ) : (
          <div className="pointer-events-auto grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3 rounded-[1.25rem] border border-border/65 bg-surface/96 p-3 shadow-[0_18px_42px_-30px_rgba(17,16,14,0.42)] backdrop-blur">
            <ConfirmAction
              action={archiveStyleReferenceAction}
              fields={selectedIds.map((id) => ({ name: "assetId", value: id }))}
              title={selectedCount === 1 ? "آیا از حذف عکس نمونه مطمئنید؟" : "آیا از حذف عکس‌های نمونه مطمئنید؟"}
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
          </div>
        )}
      </section>

      <form ref={cameraFormRef} action={uploadStyleReferenceAction}>
        <input
          id="style-reference-camera-input"
          name="image"
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            if (event.currentTarget.files?.[0]) {
              cameraFormRef.current?.requestSubmit();
            }
          }}
        />
      </form>
      <form ref={fileFormRef} action={uploadStyleReferenceAction}>
        <input
          id="style-reference-file-input"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            if (event.currentTarget.files?.[0]) {
              fileFormRef.current?.requestSubmit();
            }
          }}
        />
      </form>
      {previewSample ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/72 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-5 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={previewSample.title}
          dir="rtl"
          onClick={() => setPreviewSample(null)}
        >
          <div
            className="motion-reveal-soft w-full max-w-[24rem] overflow-hidden rounded-[1.25rem] border border-white/14 bg-[#17130f] text-surface shadow-[0_28px_70px_-34px_rgba(0,0,0,0.95)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[4/5] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewSample.fileUrl} alt={previewSample.title} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPreviewSample(null)}
                aria-label="بستن"
                className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-black/42 text-white backdrop-blur"
              >
                <CloseCircle aria-hidden={true} className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="px-4 py-3">
              <form action={createStyleReferenceFromSampleAction}>
                <input type="hidden" name="sampleId" value={previewSample.id} />
                <button
                  type="submit"
                  className={buttonClasses({ variant: "studio-primary", size: "full", className: "min-h-11 rounded-full text-xs" })}
                >
                  <DocumentUpload aria-hidden={true} className="h-4 w-4" />
                  تولید
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
