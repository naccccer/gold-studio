import Image from "next/image";
import { Eye, EyeOff, Palette, Save, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { updateCreativeStyleAction } from "@/features/admin/actions";

type AdminStyleItem = {
  id: string;
  preset: string;
  name: string;
  description: string;
  prompt: string;
  previewImageUrl: string;
  sortOrder: number;
  isActive: boolean;
  isUserVisible: boolean;
  category: {
    name: string;
  } | null;
  controls: Array<{
    id: string;
    label: string;
    type: string;
    isActive: boolean;
  }>;
  variants: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
};

type AdminStylesScreenProps = {
  styles: AdminStyleItem[];
};

export function AdminStylesScreen({ styles }: AdminStylesScreenProps) {
  return (
    <Surface padding="lg" className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
            <Palette aria-hidden="true" className="h-4 w-4" />
            کتابخانه سبک‌ها
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            سبک‌های قابل نمایش برای کاربر از دیتابیس خوانده می‌شوند. این بخش برای ویرایش نام، تصویر، ترتیب، وضعیت و پرامپت سبک‌هاست.
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface-soft px-3 py-1 text-[11px] text-muted">
          {styles.length.toLocaleString("fa-IR")} سبک
        </span>
      </div>

      <div className="grid gap-4">
        {styles.map((style) => (
          <form key={style.id} action={updateCreativeStyleAction} className="grid gap-4 rounded-[var(--radius-lg)] border border-border/70 bg-surface-soft/35 p-3 md:grid-cols-[180px_1fr]">
            <input type="hidden" name="styleId" value={style.id} />

            <div className="space-y-3">
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
                <Image src={style.previewImageUrl} alt={style.name} fill className="object-cover" sizes="180px" />
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-border bg-surface px-2 py-1 text-muted">
                  {style.category?.name ?? "بدون دسته"}
                </span>
                <span className="rounded-full border border-border bg-surface px-2 py-1 text-muted" dir="ltr">
                  {style.preset}
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                <label className="grid gap-1.5">
                  <span className="text-xs text-muted">نام سبک</span>
                  <input name="name" defaultValue={style.name} className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-border-strong" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs text-muted">ترتیب</span>
                  <input name="sortOrder" type="number" defaultValue={style.sortOrder} className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-border-strong" />
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs text-muted">توضیح کوتاه کاربر</span>
                <input name="description" defaultValue={style.description} className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-border-strong" />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs text-muted">آدرس تصویر پیش‌نمایش</span>
                <input name="previewImageUrl" defaultValue={style.previewImageUrl} dir="ltr" className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-left text-sm text-foreground outline-none focus:border-border-strong" />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs text-muted">پرامپت داخلی</span>
                <textarea name="prompt" defaultValue={style.prompt} rows={4} className="resize-none rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm leading-7 text-foreground outline-none focus:border-border-strong" />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <label className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
                    <input name="isActive" type="checkbox" defaultChecked={style.isActive} className="accent-[#c89f61]" />
                    فعال
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
                    <input name="isUserVisible" type="checkbox" defaultChecked={style.isUserVisible} className="accent-[#c89f61]" />
                    نمایش به کاربر
                  </label>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5">
                    {style.isUserVisible ? <Eye aria-hidden="true" className="h-3.5 w-3.5" /> : <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />}
                    {style.isUserVisible ? "نمایان" : "پنهان"}
                  </span>
                  {style.controls.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5">
                      <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
                      {style.controls.length.toLocaleString("fa-IR")} کنترل
                    </span>
                  ) : null}
                </div>

                <Button type="submit" size="sm">
                  <Save aria-hidden="true" className="h-4 w-4" />
                  ذخیره
                </Button>
              </div>
            </div>
          </form>
        ))}
      </div>
    </Surface>
  );
}
