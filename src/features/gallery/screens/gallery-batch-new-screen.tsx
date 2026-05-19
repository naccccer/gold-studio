import { ArrowLeft, ArrowRight, Magicpen } from "vuesax-icons-react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import type { StyleOption } from "@/features/projects/presets";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";

export type BatchSourceAsset = {
  id: string;
  fileUrl: string;
  title: string | null;
  originalName: string | null;
};

type GalleryBatchNewScreenProps = {
  assets: BatchSourceAsset[];
  styles: StyleOption[];
  availableCredits: number;
  error?: string | null;
  action: (formData: FormData) => Promise<void>;
};

const outputPresets = [
  { id: "post", label: "پست", ratio: "۱:۱" },
  { id: "story", label: "استوری", ratio: "۹:۱۶" },
  { id: "banner", label: "بنر", ratio: "۱۶:۹" },
];

export function GalleryBatchNewScreen({
  assets,
  styles,
  availableCredits,
  error,
  action,
}: GalleryBatchNewScreenProps) {
  const requiredCredits = assets.length;
  const hasEnoughCredits = availableCredits >= requiredCredits;
  const defaultStyleId = styles[0]?.id ?? "";

  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-28">
      <ButtonLink href="/gallery" variant="ghost" size="sm" className="w-fit">
        <ArrowRight aria-hidden={true} className="h-4 w-4" />
        بازگشت به گالری
      </ButtonLink>

      <section className="space-y-3 rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">تولید گروهی</h2>
            <p className="text-sm leading-7 text-muted">
              برای هر عکس یک پروژه جدا ساخته می‌شود و خروجی‌ها در پروژه‌ها ذخیره می‌شوند.
            </p>
          </div>
          <div className="rounded-full border border-accent-soft bg-accent-wash px-3 py-1 text-xs font-semibold text-accent-deep">
            {requiredCredits.toLocaleString("fa-IR")} اعتبار
          </div>
        </div>
        <p className="text-xs leading-6 text-muted">
          اعتبار هنگام شروع رزرو می‌شود و فقط بعد از ساخت موفق هر خروجی مصرف می‌شود.
        </p>
        {!hasEnoughCredits || error ? (
          <p className="rounded-[1rem] border border-danger/25 bg-danger-soft px-3 py-2 text-sm leading-6 text-danger">
            {error || "اعتبار آزاد کافی برای این تعداد تصویر ندارید."}
          </p>
        ) : null}
      </section>

      <form action={action} className="space-y-5">
        {assets.map((asset) => (
          <input key={asset.id} type="hidden" name="assetIds" value={asset.id} />
        ))}

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">قاب خروجی</legend>
          <div className="grid grid-cols-3 gap-2">
            {outputPresets.map((preset) => (
              <label
                key={preset.id}
                className="motion-press rounded-[1rem] border border-border/70 bg-surface px-3 py-3 text-center text-sm font-semibold text-foreground has-[:checked]:border-accent-soft has-[:checked]:bg-accent-wash has-[:checked]:text-accent-deep"
              >
                <input
                  type="radio"
                  name="outputPreset"
                  value={preset.id}
                  defaultChecked={preset.id === "post"}
                  className="sr-only"
                />
                <span className="block">{preset.label}</span>
                <span className="mt-1 block text-[11px] text-muted" dir="ltr">
                  {preset.ratio}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">سبک خروجی</legend>
          <div className="grid grid-cols-2 gap-3">
            {styles.map((style) => (
              <label
                key={style.id}
                className="motion-press overflow-hidden rounded-[1rem] border border-border/70 bg-surface text-right has-[:checked]:border-accent-soft has-[:checked]:ring-1 has-[:checked]:ring-accent-soft"
              >
                <input
                  type="radio"
                  name="styleId"
                  value={style.id}
                  defaultChecked={style.id === defaultStyleId}
                  className="sr-only"
                />
                <JewelryImageFrame aspect="landscape" className="rounded-none border-0 shadow-none">
                  <SafeJewelryImage
                    src={style.previewImageUrl}
                    fallbackSrc={uploadPreview.src}
                    fallbackAlt={uploadPreview.alt}
                    alt={style.label}
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                </JewelryImageFrame>
                <div className="space-y-1 px-3 py-2">
                  <p className="truncate text-xs font-semibold text-foreground">{style.label}</p>
                  <p className="line-clamp-2 text-[11px] leading-5 text-muted">{style.description}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">عکس‌های انتخاب‌شده</h3>
          <div className="grid grid-cols-3 gap-2">
            {assets.map((asset) => {
              const title = asset.title || asset.originalName || "تصویر محصول";
              return (
                <JewelryImageFrame key={asset.id} aspect="square" className="rounded-[1rem]">
                  <SafeJewelryImage
                    src={asset.fileUrl}
                    fallbackSrc={uploadPreview.src}
                    fallbackAlt={uploadPreview.alt}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </JewelryImageFrame>
              );
            })}
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.6rem)] z-30 mx-auto w-full max-w-[393px] px-4 md:max-w-[425px]">
          {hasEnoughCredits ? (
            <button type="submit" className={buttonClasses({ className: "h-12 w-full rounded-[1rem]" })}>
              شروع تولید گروهی
              <Magicpen aria-hidden={true} className="h-4 w-4" />
            </button>
          ) : (
            <ButtonLink href="/billing" className="h-12 w-full rounded-[1rem]">
              خرید اعتبار
              <ArrowLeft aria-hidden={true} className="h-4 w-4" />
            </ButtonLink>
          )}
        </div>
      </form>
    </PageShell>
  );
}
