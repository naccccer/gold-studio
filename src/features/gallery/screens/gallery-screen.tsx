"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, Check, Ellipsis, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ActionDock } from "@/components/ui/action-dock";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
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
  uploadAction: (formData: FormData) => Promise<void>;
  batchAction: (formData: FormData) => Promise<void>;
};

function UploadSubmitButton({ uploadReady }: { uploadReady: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={!uploadReady || pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#efe2cd] px-4 text-sm font-medium text-[#8b6835] transition disabled:opacity-40"
      aria-label={pending ? "در حال آپلود تصاویر" : "آپلود تصاویر"}
    >
      <Upload aria-hidden={true} className="h-4 w-4" />
      <span>{pending ? "در حال آپلود..." : "آپلود"}</span>
    </button>
  );
}

export function GalleryScreen({ assets, styles, uploadAction, batchAction }: GalleryScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadReady, setUploadReady] = useState(false);
  const [selectedUploadCount, setSelectedUploadCount] = useState(0);
  const uploadFormRef = useRef<HTMLFormElement>(null);

  function toggleAsset(assetId: string) {
    setSelectedIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  }

  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-3">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-5">
        <form
          ref={uploadFormRef}
          action={uploadAction}
          className="rounded-[1.35rem] border border-dashed border-accent bg-surface/62 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#7b7164]">عکس محصول را اضافه کن</h2>
              <p className="mt-1 text-xs text-muted">
                {uploadReady ? `${selectedUploadCount} تصویر آماده ارسال است...` : "بعد از انتخاب عکس، آپلود خودکار شروع می شود."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label
                htmlFor="gallery-upload"
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#efe2cd] text-[#8b6835]"
                aria-label="انتخاب تصویر"
              >
                <Camera aria-hidden={true} className="h-5 w-5" />
              </label>
              <UploadSubmitButton uploadReady={uploadReady} />
            </div>
          </div>
          <input
            id="gallery-upload"
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(event) => {
              const count = event.target.files?.length ?? 0;
              setSelectedUploadCount(count);
              setUploadReady(count > 0);

              if (count > 0) {
                uploadFormRef.current?.requestSubmit();
              }
            }}
          />
        </form>

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
                      <Image
                        src={asset.fileUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 240px"
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
    </PageShell>
  );
}
