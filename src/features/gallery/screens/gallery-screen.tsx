"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, Check, Ellipsis, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { ActionDock } from "@/components/ui/action-dock";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
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
    <PageShell maxWidth="lg" className="space-y-5 pb-3">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-5">
        <section className="rounded-[1.35rem] border border-dashed border-accent bg-surface/62 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#7b7164]">عکس محصول را اضافه کن</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label
                htmlFor="gallery-camera-input"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#efe2cd] px-4 text-sm font-medium text-[#8b6835]"
                aria-label="باز کردن دوربین"
              >
                <Camera aria-hidden={true} className="h-4 w-4" />
                <span>دوربین</span>
              </label>
              <label
                htmlFor="gallery-file-input"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#efe2cd] px-4 text-sm font-medium text-[#8b6835]"
                aria-label="باز کردن فایل‌ها"
              >
                <Upload aria-hidden={true} className="h-4 w-4" />
                <span>آپلود</span>
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
          <section className="space-y-3">
            <div className="relative h-[218px] overflow-hidden rounded-[1.45rem] border border-white/80 bg-[#e7ded2]">
              <Image
                src={uploadPreview.src}
                alt={uploadPreview.alt}
                fill
                priority
                className="object-cover object-[46%_55%]"
                sizes="(max-width: 768px) 100vw, 680px"
              />
            </div>
            <p className="text-center text-sm text-muted">هنوز عکسی در گالری نیست.</p>
          </section>
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
                    <div
                      className={`relative h-[136px] overflow-hidden rounded-[1.08rem] border bg-[#ebe2d6] transition ${
                        selected
                          ? "border-[#c7a96b] shadow-[0_18px_36px_-28px_rgba(17,16,14,0.58)]"
                          : "border-white/72"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.fileUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#11100e]/48 text-surface backdrop-blur">
                        <Ellipsis aria-hidden={true} className="h-4 w-4" />
                      </span>
                      {selected ? (
                        <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-surface">
                          <Check aria-hidden={true} className="h-4 w-4" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                  <Link
                    href={`/gallery/${asset.id}`}
                    aria-label={`جزئیات ${title}`}
                    className="absolute bottom-2 left-2 h-7 w-7 rounded-full"
                  />
                </article>
              );
            })}
          </section>
        )}

        <ActionDock sticky>
          {selectedIds.length === 1 ? (
            <ButtonLink href={`/projects/new?assetId=${selectedIds[0]}`} size="full" className="h-12 rounded-[1rem]">
              ادامه
              <ArrowLeft aria-hidden={true} className="h-4 w-4" />
            </ButtonLink>
          ) : selectedIds.length > 1 ? (
            <form action={batchAction}>
              {selectedIds.map((id) => (
                <input key={id} type="hidden" name="assetIds" value={id} />
              ))}
              <input type="hidden" name="styleId" value={styles[0]?.id ?? ""} />
              <input type="hidden" name="outputPreset" value="post" />
              <Button type="submit" size="full" className="h-12 rounded-[1rem]">
                <Sparkles aria-hidden={true} className="h-4 w-4" />
                ادامه
              </Button>
            </form>
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
