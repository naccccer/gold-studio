"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Images, Layers3, Plus, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
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

const outputPresets = [
  { id: "post", label: "پست" },
  { id: "story", label: "استوری" },
  { id: "banner", label: "بنر" },
];

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

export function GalleryScreen({ assets, styles, uploadAction, batchAction }: GalleryScreenProps) {
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleAsset(assetId: string) {
    setSelectedIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  }

  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-4">
      <section className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
              <Images aria-hidden="true" className="h-4 w-4" />
              گالری تصاویر خام
            </h2>
            <p className="mt-1 text-sm leading-7 text-muted">
              عکس‌های محصول را جمع کنید، بعد هر زمان خواستید از آن‌ها خروجی بسازید.
            </p>
          </div>
          {assets.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSelecting((value) => !value);
                setSelectedIds([]);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 text-xs text-muted"
            >
              <Layers3 aria-hidden="true" className="h-3.5 w-3.5" />
              {selecting ? "لغو" : "انتخاب"}
            </button>
          ) : null}
        </div>

        <form action={uploadAction} className="grid gap-2">
          <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-soft text-sm font-medium text-foreground">
            <Upload aria-hidden="true" className="h-4 w-4" />
            آپلود چند تصویر
            <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" />
          </label>
          <Button type="submit" variant="secondary" size="full">
            <Plus aria-hidden="true" className="h-4 w-4" />
            افزودن به گالری
          </Button>
        </form>
      </section>

      {selecting && selectedIds.length > 0 ? (
        <form action={batchAction} className="space-y-3 rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="assetIds" value={id} />
          ))}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              {selectedIds.length.toLocaleString("fa-IR")} تصویر انتخاب شد
            </h2>
            <span className="text-[11px] text-muted">تولید دسته‌ای</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select name="stylePreset" defaultValue={styles[0]?.preset ?? "CLEAN_WHITE"} className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-2 text-sm">
              {styles.map((style) => (
                <option key={style.id} value={style.preset}>
                  {style.label}
                </option>
              ))}
            </select>
            <select name="outputPreset" defaultValue="post" className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-2 text-sm">
              {outputPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="full">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            ساخت پروژه‌ها
          </Button>
        </form>
      ) : null}

      {assets.length === 0 ? (
        <section className="space-y-4">
          <JewelryImageFrame aspect="portrait" className="rounded-[1.25rem] bg-surface-soft shadow-none">
            <Image src={uploadPreview.src} alt={uploadPreview.alt} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 680px" />
          </JewelryImageFrame>
          <p className="text-center text-sm leading-7 text-muted">
            گالری هنوز خالی است. چند عکس خام از محصولاتتان اضافه کنید.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-4">
          {assets.map((asset) => {
            const selected = selectedIds.includes(asset.id);
            const title = asset.title || asset.originalName || "تصویر محصول";
            return (
              <article key={asset.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => (selecting ? toggleAsset(asset.id) : undefined)}
                  className="group block w-full text-right"
                  aria-label={selecting ? `انتخاب ${title}` : title}
                >
                  <JewelryImageFrame aspect="portrait" className="rounded-[1rem] bg-surface-soft shadow-none transition group-hover:border-border-strong">
                    <Image src={asset.fileUrl} alt={title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 280px" />
                    {selecting ? (
                      <span className={`absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                        selected ? "border-foreground bg-foreground text-surface" : "border-white/60 bg-black/20 text-surface"
                      }`}>
                        {selected ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
                      </span>
                    ) : null}
                  </JewelryImageFrame>
                </button>
                <div className="space-y-1 px-0.5">
                  <Link href={`/gallery/${asset.id}`} className="block truncate text-sm text-foreground">
                    {title}
                  </Link>
                  <p className="truncate text-[10px] text-muted/70">
                    {dateFormatter.format(asset.createdAt)}
                    <span className="px-1">·</span>
                    {asset.projects.length.toLocaleString("fa-IR")} خروجی
                  </p>
                  {!selecting ? (
                    <ButtonLink href={`/projects/new?assetId=${asset.id}`} variant="ghost" size="sm" className="h-8 w-full border border-border/60 text-[11px]">
                      <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                      تولید از این تصویر
                    </ButtonLink>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </PageShell>
  );
}
