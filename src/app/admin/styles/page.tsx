import Image from "next/image";
import { Eye, EyeOff, Plus, Save, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminMetric, AdminSection } from "@/features/admin/components/admin-ui";
import { createCreativeStyleAction, updateCreativeStyleAction } from "@/features/admin/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminStylesPage() {
  const styles = await db.creativeStyle.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      category: true,
      controls: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      _count: { select: { projects: true } },
    },
  });

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-4">
        <AdminMetric label="کل سبک‌ها" value={styles.length} />
        <AdminMetric label="فعال" value={styles.filter((style) => style.isActive).length} />
        <AdminMetric label="نمایان برای کاربر" value={styles.filter((style) => style.isUserVisible).length} />
        <AdminMetric label="دارای کنترل" value={styles.filter((style) => style.controls.length > 0).length} />
      </section>

      <AdminSection title="ساخت سبک جدید" eyebrow="پرامپت داخلی">
        <form action={createCreativeStyleAction} className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
            <input name="name" placeholder="نام سبک" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
            <input name="sortOrder" type="number" defaultValue={styles.length * 10 + 10} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          </div>
          <input name="description" placeholder="توضیح کوتاه برای کاربر" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          <input name="previewImageUrl" defaultValue="/images/placeholders/jewelry/style-minimal.webp" dir="ltr" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-left text-sm outline-none" />
          <textarea name="prompt" rows={4} placeholder="پرامپت داخلی سبک" className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-left text-sm leading-6 outline-none" dir="ltr" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs text-muted">
                <input name="isActive" type="checkbox" defaultChecked className="accent-[#b28b52]" />
                فعال
              </label>
              <label className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs text-muted">
                <input name="isUserVisible" type="checkbox" defaultChecked className="accent-[#b28b52]" />
                نمایش به کاربر
              </label>
            </div>
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" />
              ساخت سبک
            </Button>
          </div>
        </form>
      </AdminSection>

      <AdminSection title="کتابخانه سبک‌ها" eyebrow="ویرایش امن پرامپت و وضعیت">
        <div className="space-y-3">
          {styles.map((style) => (
            <form key={style.id} action={updateCreativeStyleAction} className="grid gap-4 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/35 p-3 xl:grid-cols-[180px_minmax(0,1fr)]">
              <input type="hidden" name="styleId" value={style.id} />
              <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
                  <Image src={style.previewImageUrl} alt={style.name} fill className="object-cover" sizes="180px" />
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted">
                  <span className="rounded-full border border-border bg-surface px-2 py-1">{style.category?.name ?? "بدون دسته"}</span>
                  <span className="rounded-full border border-border bg-surface px-2 py-1">{style._count.projects.toLocaleString("fa-IR")} پروژه</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1">
                    <SlidersHorizontal className="h-3 w-3" />
                    {style.controls.length.toLocaleString("fa-IR")} کنترل
                  </span>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                  <input name="name" defaultValue={style.name} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
                  <input name="sortOrder" type="number" defaultValue={style.sortOrder} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
                </div>
                <input name="description" defaultValue={style.description} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
                <input name="previewImageUrl" defaultValue={style.previewImageUrl} dir="ltr" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-left text-sm outline-none" />
                <textarea name="prompt" defaultValue={style.prompt} rows={7} className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-left text-xs leading-5 outline-none" dir="ltr" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                    <label className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3">
                      <input name="isActive" type="checkbox" defaultChecked={style.isActive} className="accent-[#b28b52]" />
                      فعال
                    </label>
                    <label className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3">
                      <input name="isUserVisible" type="checkbox" defaultChecked={style.isUserVisible} className="accent-[#b28b52]" />
                      نمایش به کاربر
                    </label>
                    <span className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3">
                      {style.isUserVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {style.isUserVisible ? "نمایان" : "پنهان"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted">تغییر پرامپت سبک‌های عمومی در دفتر ادمین ثبت می‌شود.</span>
                    <Button type="submit" size="sm">
                      <Save className="h-4 w-4" />
                      ذخیره
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ))}
        </div>
      </AdminSection>
    </>
  );
}
