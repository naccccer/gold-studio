import type { ReactNode } from "react";
import Image from "next/image";
import { Plus, Upload, Eye, EyeOff, Images, Info, Save, Settings, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { AdminModal } from "@/features/admin/components/admin-modal";
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
  deleteStyleControlAction,
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
const pillClass =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-[11px] text-muted";
const hiddenLegacyStyleIds = new Set(["style_warm_luxury"]);

function isEffectivelyUserVisible(style: { id: string; isActive: boolean; isUserVisible: boolean }) {
  return style.isActive && style.isUserVisible && !hiddenLegacyStyleIds.has(style.id);
}

function isAvailableChecked(style: { id: string; isActive: boolean; isUserVisible: boolean }) {
  return style.isActive && style.isUserVisible && !hiddenLegacyStyleIds.has(style.id);
}

function getSystemBadges(style: { id: string }) {
  const badges: string[] = [];

  if (style.id === "style_warm_luxury") {
    badges.push("legacy hidden");
  }

  if (style.id === "style_soft_editorial") {
    badges.push("background decor always on");
  }

  if (style.id === "style_sample_reference") {
    badges.push("requires sample image");
    badges.push("matches sample angle");
  }

  return badges;
}

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

function PreviewUpload() {
  return (
    <label className="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs font-medium text-foreground transition hover:border-border-strong hover:bg-surface-soft">
      <Upload className="h-4 w-4" aria-hidden={true} />
      آپلود عکس کارت
      <input name="previewImage" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" />
    </label>
  );
}

function AvailabilityToggle({ defaultChecked = true }: { defaultChecked?: boolean }) {
  return (
    <label className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs font-medium text-foreground">
      <input name="isAvailableToUsers" type="checkbox" defaultChecked={defaultChecked} className="accent-accent" />
      قابل استفاده برای کاربر
    </label>
  );
}

function VisibilityPill({ visible }: { visible: boolean }) {
  return (
    <span className={pillClass}>
      {visible ? <Eye className="h-3.5 w-3.5" aria-hidden={true} /> : <EyeOff className="h-3.5 w-3.5" aria-hidden={true} />}
      {visible ? "نمایان در فرم کاربر" : "پنهان از کاربر"}
    </span>
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
        <AdminMetric label="قابل استفاده" value={styles.filter(isEffectivelyUserVisible).length} />
        <AdminMetric label="پنهان" value={styles.filter((style) => !isEffectivelyUserVisible(style)).length} />
        <AdminMetric label="دارای کنترل" value={styles.filter((style) => style.controls.length > 0).length} />
      </section>

      <AdminSection title="وضعیت مسیر سبک‌ها" eyebrow="هماهنگ با جریان کاربر">
        <div className="grid gap-2 text-sm leading-7 text-muted md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-3">
            <p className="inline-flex items-center gap-2 font-semibold text-foreground">
              <Info className="h-4 w-4" aria-hidden={true} />
              انتزاعی مستقل
            </p>
            <p className="mt-1 text-xs leading-6">
              `style_warm_luxury` برای پروژه‌های قدیمی می‌ماند، اما در انتخاب سبک کاربر نمایش داده نمی‌شود.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-3">
            <p className="inline-flex items-center gap-2 font-semibold text-foreground">
              <Info className="h-4 w-4" aria-hidden={true} />
              ادیتوریال
            </p>
            <p className="mt-1 text-xs leading-6">
              `editorialMood` فقط حالت‌های اصلی مجله‌ای را دارد و دکور پس‌زمینه همیشه در prompt کنترل می‌شود.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-3">
            <p className="inline-flex items-center gap-2 font-semibold text-foreground">
              <Info className="h-4 w-4" aria-hidden={true} />
              عکس نمونه
            </p>
            <p className="mt-1 text-xs leading-6">
              `style_sample_reference` بدون sample ارسال نمی‌شود و چیدمان، نور، رنگ، زاویه و پرسپکتیو نمونه را منتقل می‌کند.
            </p>
          </div>
        </div>
      </AdminSection>

      <AdminSection title="ساخت سبک جدید" eyebrow="سبک عمومی یا تست داخلی">
        <form action={createCreativeStyleAction} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
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
          <div className="flex flex-col items-start justify-between gap-3">
            <PreviewUpload />
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <AvailabilityToggle />
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4" />
                ساخت سبک
              </Button>
            </div>
          </div>
        </form>
      </AdminSection>

      <AdminSection title="سبک‌های آماده" eyebrow="تصویر کارت، متن کاربر، پرامپت و تنظیمات">
        <div className="grid gap-3">
          {styles.map((style) => {
            const systemBadges = getSystemBadges(style);
            const effectivelyVisible = isEffectivelyUserVisible(style);

            return (
              <article key={style.id} className="rounded-[var(--radius-lg)] border border-border/80 bg-surface-soft/35 p-3">
                <form action={updateCreativeStyleAction} className="grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)]">
                  <input type="hidden" name="styleId" value={style.id} />
                  <input type="hidden" name="currentPreviewImageUrl" value={style.previewImageUrl} />

                  <aside className="grid content-start gap-3">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface xl:aspect-square">
                      <Image src={style.previewImageUrl} alt={style.name} fill className="object-cover" sizes="190px" />
                    </div>
                    <PreviewUpload />
                  </aside>

                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold leading-6 text-foreground">{style.name}</h3>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <span className={pillClass}>
                            <Images className="h-3.5 w-3.5" aria-hidden={true} />
                            {style._count.projects.toLocaleString("fa-IR")} پروژه
                          </span>
                          <span className={pillClass}>
                            <Settings className="h-3.5 w-3.5" aria-hidden={true} />
                            {style.controls.length.toLocaleString("fa-IR")} کنترل
                          </span>
                          <span className={pillClass}>{style.category?.name ?? "بدون دسته"}</span>
                          <VisibilityPill visible={effectivelyVisible} />
                          {systemBadges.map((badge) => (
                            <span key={badge} className={pillClass}>
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                      <AdminModal
                        title={`تنظیمات ${style.name}`}
                        trigger={
                          <span className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs font-medium text-foreground transition hover:border-border-strong hover:bg-surface-soft">
                            <Settings className="h-4 w-4" aria-hidden={true} />
                            تنظیمات
                          </span>
                        }
                      >
                        <section className="grid gap-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">کنترل‌های این سبک</h3>
                              <p className="mt-0.5 text-[11px] text-muted">
                                کنترل‌ها همان گزینه‌هایی هستند که کاربر در مرحله انتخاب سبک می‌بیند.
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            {style.controls.map((control) => (
                              <section key={control.id} className="rounded-[var(--radius-md)] border border-border/70 bg-surface p-3">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-foreground">{control.label}</p>
                                    <p className="mt-0.5 text-[11px] text-muted" dir="ltr">
                                      {control.key}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={pillClass}>
                                      {control.isActive ? <CheckCircle className="h-3.5 w-3.5" aria-hidden={true} /> : <EyeOff className="h-3.5 w-3.5" aria-hidden={true} />}
                                      {control.isActive ? "فعال" : "غیرفعال"}
                                    </span>
                                    <ConfirmAction
                                      action={deleteStyleControlAction}
                                      fields={[{ name: "controlId", value: control.id }]}
                                      title="کنترل حذف شود؟"
                                      description="این گزینه از فرم سبک کاربر حذف می‌شود."
                                      confirmLabel="حذف"
                                      trigger={(open) => (
                                        <button
                                          type="button"
                                          onClick={open}
                                          aria-label="حذف کنترل"
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-danger/30 bg-danger-soft text-danger transition hover:border-danger"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" aria-hidden={true} />
                                        </button>
                                      )}
                                    />
                                  </div>
                                </div>

                                <form action={updateStyleControlAction} className="grid gap-3">
                                  <input type="hidden" name="controlId" value={control.id} />
                                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(130px,180px)_120px_90px]">
                                    <Field label="برچسب">
                                      <input name="label" defaultValue={control.label} className={adminCompactInputClass} />
                                    </Field>
                                    <Field label="کلید">
                                      <input name="key" defaultValue={control.key} dir="ltr" className={`${adminCompactInputClass} text-left`} />
                                    </Field>
                                    <Field label="نوع">
                                      <ControlTypeSelect defaultValue={control.type} />
                                    </Field>
                                    <Field label="ترتیب">
                                      <input name="sortOrder" type="number" defaultValue={control.sortOrder} className={adminCompactInputClass} />
                                    </Field>
                                  </div>

                                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_140px_100px_100px]">
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
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                                    <label className={pillClass}>
                                      <input name="isActive" type="checkbox" defaultChecked={control.isActive} className="accent-accent" />
                                      فعال
                                    </label>
                                    <Button type="submit" size="sm" className="h-8 min-h-0 rounded-[var(--radius-sm)] px-3 text-xs">
                                      <Save className="h-3.5 w-3.5" />
                                      ذخیره کنترل
                                    </Button>
                                  </div>
                                </form>
                              </section>
                            ))}
                          </div>

                          <form action={createStyleControlAction} className="rounded-[var(--radius-md)] border border-dashed border-border bg-surface/70 p-3">
                            <input type="hidden" name="styleId" value={style.id} />
                            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
                              <Plus className="h-4 w-4" aria-hidden={true} />
                              کنترل جدید
                            </div>
                            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(130px,180px)_120px_90px]">
                              <Field label="برچسب">
                                <input name="label" placeholder="سایه نرم" className={adminCompactInputClass} />
                              </Field>
                              <Field label="کلید">
                                <input name="key" placeholder="softShadow" dir="ltr" className={`${adminCompactInputClass} text-left`} />
                              </Field>
                              <Field label="نوع">
                                <ControlTypeSelect defaultValue="CHOICE" />
                              </Field>
                              <Field label="ترتیب">
                                <input name="sortOrder" type="number" defaultValue={style.controls.length * 10 + 10} className={adminCompactInputClass} />
                              </Field>
                            </div>

                            <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_140px_100px_100px]">
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
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                              <label className={pillClass}>
                                <input name="isActive" type="checkbox" defaultChecked className="accent-accent" />
                                فعال
                              </label>
                              <Button type="submit" size="sm" className="h-8 min-h-0 rounded-[var(--radius-sm)] px-3 text-xs">
                                <Plus className="h-3.5 w-3.5" />
                                افزودن کنترل
                              </Button>
                            </div>
                          </form>
                        </section>
                      </AdminModal>
                    </div>

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

                    <Field label="پرامپت سبک">
                      <textarea name="prompt" defaultValue={style.prompt} rows={5} className={`${adminTextareaClass} text-left text-xs leading-6`} dir="ltr" />
                    </Field>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                      <AvailabilityToggle defaultChecked={isAvailableChecked(style)} />
                      <Button type="submit" size="sm">
                        <Save className="h-4 w-4" />
                        ذخیره سبک
                      </Button>
                    </div>
                  </div>
                </form>
              </article>
            );
          })}
        </div>
      </AdminSection>
    </>
  );
}
