"use client";

import { useRef, useState } from "react";
import { Camera, XCircle, Upload, Pencil, CheckCircle, Trash2 } from "lucide-react";
import { buttonClasses, Button, IconButton } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldControlClassName } from "@/components/ui/field";
import {
  contextMenuDangerItemClasses,
  ItemContextMenu,
} from "@/components/ui/item-context-menu";

import { PageShell } from "@/components/ui/page-shell";
import {
  archiveStyleReferenceAction,
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

type StyleReferenceGalleryScreenProps = {
  assets: StyleReferenceGalleryItem[];
  error?: string | null;
};

function assetTitle(asset: StyleReferenceGalleryItem) {
  return asset.title || asset.originalName || "عکس نمونه";
}

export function StyleReferenceGalleryScreen({ assets, error }: StyleReferenceGalleryScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileFormRef = useRef<HTMLFormElement>(null);
  const cameraFormRef = useRef<HTMLFormElement>(null);
  const selectedCount = selectedIds.length;

  function toggleAsset(assetId: string) {
    setSelectedIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  }

  return (
    <>
      <PageShell maxWidth="lg" className="space-y-5 pb-[12.5rem]">
        <header className="space-y-1">
          <p className="text-xs font-semibold text-accent-deep">حساب</p>
          <h1 className="text-xl font-semibold text-foreground">گالری نمونه‌ها</h1>
        </header>

        {error ? (
          <p className="rounded-[1rem] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {assets.length === 0 ? (
          <EmptyState
            title="هنوز عکس نمونه‌ای ندارید."
            className="pt-2"
            media={
              // eslint-disable-next-line @next/next/no-img-element
              <img src={uploadPreview.src} alt={uploadPreview.alt} className="h-full w-full object-cover object-[46%_55%]" />
            }
          />
        ) : (
          <section className="grid grid-cols-2 gap-3">
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
                    <ImageFrame aspect="gallery" selected={selected} className="rounded-[var(--radius-lg)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.fileUrl} alt={title} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/68 via-black/24 via-38% to-transparent px-2.5 pb-1.5 pt-5">
                        <p className="relative z-10 flex min-h-11 items-center truncate pl-12 text-xs font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                          {title}
                        </p>
                      </div>
                      {selected ? (
                        <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-surface">
                          <CheckCircle aria-hidden={true} className="h-4 w-4" />
                        </span>
                      ) : null}
                    </ImageFrame>
                  </button>
                  <div className="absolute bottom-1.5 left-1.5">
                    <ItemContextMenu label={`منوی ${title}`} align="right">
                      <form action={renameStyleReferenceAction} className="space-y-1.5 px-1 py-1.5">
                        <input type="hidden" name="assetId" value={asset.id} />
                        <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                          <Pencil aria-hidden={true} className="h-3.5 w-3.5" />
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
                            <Trash2 aria-hidden={true} className="h-3.5 w-3.5" />
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
      </PageShell>

      <section className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.85rem)] z-30 mx-auto w-full max-w-[393px] px-4 md:max-w-[425px]">
        {selectedCount === 0 ? (
          <div className="pointer-events-auto grid grid-cols-2 gap-3 rounded-[1.25rem] border border-dashed border-accent/58 bg-surface/95 p-3 shadow-[0_18px_42px_-30px_rgba(17,16,14,0.32)] backdrop-blur">
            <label htmlFor="style-reference-file-input" className={buttonClasses({ className: "h-12 w-full rounded-[1rem]" })}>
              <Upload aria-hidden={true} className="h-4 w-4" />
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
                  <Trash2 aria-hidden={true} className="h-4 w-4" />
                </IconButton>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-11 w-full rounded-full border border-foreground/18 bg-surface text-xs font-bold text-foreground shadow-[0_12px_24px_-20px_rgba(17,16,14,0.68)] hover:bg-surface-soft"
            >
              <XCircle aria-hidden={true} className="h-4 w-4" />
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
    </>
  );
}
