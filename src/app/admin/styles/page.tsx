import type { ReactNode } from "react";
import Image from "next/image";
import { Add, DocumentUpload, Eye, EyeSlash, Gallery, Save2, Setting4 } from "vuesax-icons-react";
import { Button } from "@/components/ui/button";
import {
  adminCompactInputClass,
  adminInputClass,
  adminTextareaClass,
  AdminMetric,
  AdminSection,
} from "@/features/admin/components/admin-ui";
import {
  createCreativeStyleAction,
  createStyleControlAction,
  updateCreativeStyleAction,
  updateStyleControlAction,
} from "@/features/admin/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type ControlType = "CHOICE" | "RANGE" | "BOOLEAN";

const controlTypeLabels: Record<ControlType, string> = {
  CHOICE: "انتخابی",
  RANGE: "اسلایدی",
  BOOLEAN: "تیک‌زدنی",
};

const labelClass = "grid min-w-0 gap-1.5 text-[11px] font-medium text-muted";
const pillClass = "inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-[11px] text-muted";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={labelClass}>
      {label}
      {children}
    </label>
  );
}

function ControlTypeSelect({ defaultValue }: { defaultValue: ControlType }) {
  return (
    <select name="type" defaultValue={defaultValue} className={adminCompactInputClass}>
      {Object.entries(controlTypeLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function PreviewUpload({ currentUrl }: { currentUrl?: string }) {
  return (
    <label className="group flex min-h-24 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-border bg-surface-soft/45 px-3 py-3 transition hover:border-border-strong hover:bg-surface-soft">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface text-muted transition group-hover:text-foreground">
        <DocumentUpload className="h-5 w-5" aria-hidden={true} />
      </span>
      <span className="min-w-0 space-y-1">
        <span className="block text-xs font-semibold text-foreground">آپلود عکس کارت</span>
        <span className="block text-[11px] leading-5 text-muted">JPG، PNG یا WEBP. اگر فایلی انتخاب نشود، تصویر فعلی حفظ می‌شود.</span>
        {currentUrl ? (
          <span className="block truncate text-[10px] text-muted" dir="ltr">
            {currentUrl}
          </span>
        ) : null}
      </span>
      <input name="previewImage" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" />
    </label>
  );
}

export default async function AdminStylesPage() {
  const styles = await db.creativeStyle.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      category: true,
      controls: { orderBy: { sortOrder: "asc" } },
      _count: { select: { projects: true } },
    },
  });

  return (
    <>
      <section className="grid gap-2.5 sm:grid-cols-4">
        <AdminMetric label="کل سبک‌ها" value={styles.length} />
        <AdminMetric label="فعال" value={styles.filter((style) => style.isActive).length} />
        <AdminMetric label="نمایان برای کاربر" value={styles.filter((style) => style.isUserVisible).length} />
        <AdminMetric label="دارای کنترل" value={styles.filter((style) => style.controls.length > 0).length} />
      </section>

      <AdminSection title="ساخت سبک جدید" eyebrow="سبک عمومی یا تست داخلی">
        <form action={createCreativeStyleAction} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
              <Field label="نام سبک">
                <input name="name" placeholder="مثلا پس‌زمینه سفید" className={adminInputClass} />
              </Field>
              <Field label="ترتیب">
                <input name="sortOrder" type="number" defaultValue={styles.length * 10 + 10} className={adminInputClass} />
              </Field>
            </div>
            <Field label="توضیح کوتاه برای کاربر">
              <input name="description" placeholder="یک جمله کوتاه و قابل فهم" className={adminInputClass} />
            </Field>
            <Field label="پرامپت داخلی">
              <textarea name="prompt" rows={4} placeholder="Prompt used by generation pipeline" className={`${adminTextareaClass} text-left`} dir="ltr" />
            </Field>
          </div>
          <div className="grid content-between gap-3">
            <PreviewUpload />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <label className={pillClass}>
                  <input name="isActive" type="checkbox" defaultChecked className="accent-accent" />
                  فعال
                </label>
                <label className={pillClass}>
                  <input name="isUserVisible" type="checkbox" defaultChecked className="accent-accent" />
                  نمایش به کاربر
                </label>
              </div>
              <Button type="submit" size="sm">
                <Add className="h-4 w-4" />
                ساخت سبک
              </Button>
            </div>
          </div>
        </form>
      </AdminSection>

      <AdminSection title="سبک‌های آماده" eyebrow="تصویر کارت، متن کاربر، پرامپت و تنظیمات">
        <div className="grid gap-4">
          {styles.map((style) => (
            <article key={style.id} className="rounded-[var(--radius-lg)] border border-border/80 bg-surface-soft/35 p-3">
              <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="space-y-3">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface xl:aspect-square">
                    <Image src={style.previewImageUrl} alt={style.name} fill className="object-cover" sizes="220px" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={pillClass}>
                      <Gallery className="h-3.5 w-3.5" aria-hidden={true} />
                      {style._count.projects.toLocaleString("fa-IR")} پروژه
                    </span>
                    <span className={pillClass}>
                      <Setting4 className="h-3.5 w-3.5" aria-hidden={true} />
                      {style.controls.length.toLocaleString("fa-IR")} کنترل
                    </span>
                    <span className={pillClass}>{style.category?.name ?? "بدون دسته"}</span>
                  </div>
                </aside>

                <div className="grid gap-4">
                  <form action={updateCreativeStyleAction} className="grid gap-3">
                    <input type="hidden" name="styleId" value={style.id} />
                    <input type="hidden" name="currentPreviewImageUrl" value={style.previewImageUrl} />

                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px]">
                      <Field label="نام کارت">
                        <input name="name" defaultValue={style.name} className={adminInputClass} />
                      </Field>
                      <Field label="ترتیب">
                        <input name="sortOrder" type="number" defaultValue={style.sortOrder} className={adminInputClass} />
                      </Field>
                    </div>

                    <Field label="توضیح کوتاه در UI کاربر">
                      <input name="description" defaultValue={style.description} className={adminInputClass} />
                    </Field>

                    <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
                      <Field label="عکس کارت">
                        <PreviewUpload currentUrl={style.previewImageUrl} />
                      </Field>
                      <Field label="پرامپت سبک">
                        <textarea name="prompt" defaultValue={style.prompt} rows={6} className={`${adminTextareaClass} text-left text-xs leading-6`} dir="ltr" />
                      </Field>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                      <div className="flex flex-wrap gap-2">
                        <label className={pillClass}>
                          <input name="isActive" type="checkbox" defaultChecked={style.isActive} className="accent-accent" />
                          فعال
                        </label>
                        <label className={pillClass}>
                          <input name="isUserVisible" type="checkbox" defaultChecked={style.isUserVisible} className="accent-accent" />
                          نمایش به کاربر
                        </label>
                        <span className={pillClass}>
                          {style.isUserVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeSlash className="h-3.5 w-3.5" />}
                          {style.isUserVisible ? "نمایان" : "پنهان"}
                        </span>
                      </div>
                      <Button type="submit" size="sm">
                        <Save2 className="h-4 w-4" />
                        ذخیره سبک
                      </Button>
                    </div>
                  </form>

                  <section className="grid gap-3 border-t border-border/70 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">تنظیمات این سبک</h3>
                        <p className="mt-0.5 text-[11px] text-muted">کنترل‌ها کم و مرتبط بمانند؛ برای هر سبک معمولا ۱ تا ۲ مورد کافی است.</p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {style.controls.map((control) => (
                        <form key={control.id} action={updateStyleControlAction} className="rounded-[var(--radius-md)] border border-border/70 bg-surface p-3">
                          <input type="hidden" name="controlId" value={control.id} />
                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_120px_auto] lg:items-end">
                            <Field label="برچسب">
                              <input name="label" defaultValue={control.label} className={adminCompactInputClass} />
                            </Field>
                            <Field label="کلید">
                              <input name="key" defaultValue={control.key} dir="ltr" className={`${adminCompactInputClass} text-left`} />
                            </Field>
                            <Field label="نوع">
                              <ControlTypeSelect defaultValue={control.type} />
                            </Field>
                            <div className="flex items-center gap-2">
                              <label className={pillClass}>
                                <input name="isActive" type="checkbox" defaultChecked={control.isActive} className="accent-accent" />
                                فعال
                              </label>
                              <Button type="submit" size="sm" className="h-8 px-2.5">
                                <Save2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_110px_90px_90px_90px]">
                            <Field label="گزینه‌ها برای انتخابی">
                              <input name="optionsJson" defaultValue={control.optionsJson ?? ""} dir="ltr" className={`${adminCompactInputClass} text-left`} />
                            </Field>
                            <Field label="پیش‌فرض">
                              <input name="defaultValue" defaultValue={control.defaultValue ?? ""} dir="ltr" className={`${adminCompactInputClass} text-left`} />
                            </Field>
                            <Field label="کمینه">
                              <input name="minValue" type="number" defaultValue={control.minValue ?? ""} className={adminCompactInputClass} />
                            </Field>
                            <Field label="بیشینه">
                              <input name="maxValue" type="number" defaultValue={control.maxValue ?? ""} className={adminCompactInputClass} />
                            </Field>
                            <Field label="ترتیب">
                              <input name="sortOrder" type="number" defaultValue={control.sortOrder} className={adminCompactInputClass} />
                            </Field>
                          </div>
                        </form>
                      ))}
                    </div>

                    <form action={createStyleControlAction} className="rounded-[var(--radius-md)] border border-dashed border-border bg-surface/70 p-3">
                      <input type="hidden" name="styleId" value={style.id} />
                      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Add className="h-4 w-4" aria-hidden={true} />
                        کنترل جدید
                      </div>
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_120px_auto] lg:items-end">
                        <Field label="برچسب">
                          <input name="label" placeholder="سایه نرم" className={adminCompactInputClass} />
                        </Field>
                        <Field label="کلید">
                          <input name="key" placeholder="softShadow" dir="ltr" className={`${adminCompactInputClass} text-left`} />
                        </Field>
                        <Field label="نوع">
                          <ControlTypeSelect defaultValue="CHOICE" />
                        </Field>
                        <div className="flex items-center gap-2">
                          <label className={pillClass}>
                            <input name="isActive" type="checkbox" defaultChecked className="accent-accent" />
                            فعال
                          </label>
                          <Button type="submit" size="sm" className="h-8 px-2.5">
                            <Add className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_110px_90px_90px_90px]">
                        <Field label="گزینه‌ها">
                          <input name="optionsJson" placeholder='[{"value":"low","label":"کم"}]' dir="ltr" className={`${adminCompactInputClass} text-left`} />
                        </Field>
                        <Field label="پیش‌فرض">
                          <input name="defaultValue" dir="ltr" className={`${adminCompactInputClass} text-left`} />
                        </Field>
                        <Field label="کمینه">
                          <input name="minValue" type="number" className={adminCompactInputClass} />
                        </Field>
                        <Field label="بیشینه">
                          <input name="maxValue" type="number" className={adminCompactInputClass} />
                        </Field>
                        <Field label="ترتیب">
                          <input name="sortOrder" type="number" defaultValue={style.controls.length * 10 + 10} className={adminCompactInputClass} />
                        </Field>
                      </div>
                    </form>
                  </section>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AdminSection>
    </>
  );
}
