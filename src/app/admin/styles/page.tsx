import Image from "next/image";
import {
  Add,
  Eye,
  EyeSlash,
  Save2,
  Setting4,
  Trash,
} from "vuesax-icons-react";
import { ConfirmAction } from "@/components/ui/confirm-action";
import {
  adminCompactInputClass,
  adminDangerActionClass,
  adminInputClass,
  adminPrimaryActionClass,
  adminSecondaryActionClass,
  adminTableCellClass,
  adminTextareaClass,
  AdminDataTable,
  AdminEmptyState,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
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

const hiddenLegacyStyleIds = new Set(["style_warm_luxury"]);

function isEffectivelyUserVisible(style: { id: string; isActive: boolean; isUserVisible: boolean }) {
  return style.isActive && style.isUserVisible && !hiddenLegacyStyleIds.has(style.id);
}

function ControlTypeSelect({ defaultValue, form }: { defaultValue: ControlType; form?: string }) {
  return (
    <select name="type" defaultValue={defaultValue} form={form} className={adminCompactInputClass}>
      {Object.entries(controlTypeLabels).map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}

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
      <AdminPageHeader
        title="سبک‌ها و کنترل‌ها"
        description="کاتالوگ سبک‌ها، تصویر preview، prompt داخلی، visibility و کنترل‌هایی که در فرم کاربر دیده می‌شوند."
      />

      <AdminKpiStrip>
        <AdminKpi label="کل سبک‌ها" value={styles.length} />
        <AdminKpi label="قابل استفاده" value={styles.filter(isEffectivelyUserVisible).length} />
        <AdminKpi label="پنهان" value={styles.filter((style) => !isEffectivelyUserVisible(style)).length} />
        <AdminKpi label="دارای کنترل" value={styles.filter((style) => style.controls.length > 0).length} />
        <AdminKpi label="Variant" value={styles.reduce((sum, style) => sum + style.variants.length, 0)} />
      </AdminKpiStrip>

      <AdminPanel title="ساخت سبک جدید" description="برای سبک عمومی، تست داخلی یا مسیر sample reference.">
        <form action={createCreativeStyleAction} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_120px_220px_auto] lg:items-end">
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
            نام سبک
            <input name="name" placeholder="مثلا پس‌زمینه سفید" className={adminInputClass} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
            ترتیب
            <input name="sortOrder" type="number" defaultValue={styles.length * 10 + 10} className={adminInputClass} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
            تصویر preview
            <input name="previewImageUrl" defaultValue="/images/placeholders/jewelry/style-minimal.webp" dir="ltr" className={`${adminInputClass} text-left`} />
          </label>
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-950">
            <input name="isAvailableToUsers" type="checkbox" defaultChecked className="h-4 w-4 accent-slate-950" />
            قابل استفاده
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600 lg:col-span-2">
            توضیح کوتاه برای کاربر
            <input name="description" className={adminInputClass} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600 lg:col-span-2">
            Prompt داخلی
            <textarea name="prompt" rows={4} dir="ltr" className={`${adminTextareaClass} text-left`} />
          </label>
          <button className={adminPrimaryActionClass}>
            <Add className="h-4 w-4" />
            ساخت سبک
          </button>
        </form>
      </AdminPanel>

      <AdminPanel title="کاتالوگ سبک‌ها">
        <div className="divide-y divide-slate-100">
          {styles.map((style) => {
            const visible = isEffectivelyUserVisible(style);
            const VisibilityIcon = visible ? Eye : EyeSlash;
            return (
              <section key={style.id} className="grid gap-4 p-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image src={style.previewImageUrl} alt={style.name} fill className="object-cover" sizes="220px" />
                  </div>
                  <div className="grid gap-2 text-xs text-slate-600">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1">
                      <VisibilityIcon className="h-3.5 w-3.5" />
                      {visible ? "قابل استفاده برای کاربر" : "پنهان از کاربر"}
                    </span>
                    <span>{style._count.projects.toLocaleString("fa-IR")} پروژه · {style.controls.length.toLocaleString("fa-IR")} کنترل · {style.variants.length.toLocaleString("fa-IR")} variant</span>
                    <span>{style.category?.name ?? "بدون دسته"}</span>
                    <span dir="ltr">{style.id}</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <form action={updateCreativeStyleAction} className="grid gap-3">
                    <input type="hidden" name="styleId" value={style.id} />
                    <input type="hidden" name="currentPreviewImageUrl" value={style.previewImageUrl} />
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_110px_220px_auto] md:items-end">
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        نام کارت
                        <input name="name" defaultValue={style.name} className={adminInputClass} />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        ترتیب
                        <input name="sortOrder" type="number" defaultValue={style.sortOrder} className={adminInputClass} />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        تصویر preview
                        <input name="previewImageUrl" defaultValue={style.previewImageUrl} dir="ltr" className={`${adminInputClass} text-left`} />
                      </label>
                      <label className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-950">
                        <input name="isAvailableToUsers" type="checkbox" defaultChecked={visible} className="h-4 w-4 accent-slate-950" />
                        قابل استفاده
                      </label>
                    </div>
                    <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                      توضیح کوتاه در UI کاربر
                      <input name="description" defaultValue={style.description} className={adminInputClass} />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                      Prompt سبک
                      <textarea name="prompt" defaultValue={style.prompt} rows={5} dir="ltr" className={`${adminTextareaClass} text-left text-xs leading-6`} />
                    </label>
                    <button className={adminPrimaryActionClass}>
                      <Save2 className="h-4 w-4" />
                      ذخیره سبک
                    </button>
                  </form>

                  <AdminPanel title="کنترل‌ها" description="گزینه‌هایی که کاربر هنگام انتخاب سبک می‌بیند.">
                    <AdminDataTable headers={["کنترل", "نوع", "گزینه/محدوده", "پیش‌فرض", "وضعیت", "عملیات"]} empty={<AdminEmptyState title="کنترلی برای این سبک ثبت نشده است." />}>
                      {style.controls.map((control) => (
                        <tr key={control.id}>
                          <td className={adminTableCellClass}>
                            <form id={`control-${control.id}`} action={updateStyleControlAction} className="grid gap-2">
                              <input type="hidden" name="controlId" value={control.id} />
                              <input name="label" defaultValue={control.label} className={adminCompactInputClass} />
                              <input name="key" defaultValue={control.key} dir="ltr" className={`${adminCompactInputClass} text-left`} />
                            </form>
                          </td>
                          <td className={adminTableCellClass}><ControlTypeSelect defaultValue={control.type as ControlType} form={`control-${control.id}`} /></td>
                          <td className={adminTableCellClass}>
                            <div className="grid gap-2">
                              <input form={`control-${control.id}`} name="optionsJson" defaultValue={control.optionsJson ?? ""} dir="ltr" className={`${adminCompactInputClass} text-left`} />
                              <div className="grid grid-cols-2 gap-2">
                                <input form={`control-${control.id}`} name="minValue" type="number" defaultValue={control.minValue ?? ""} className={adminCompactInputClass} />
                                <input form={`control-${control.id}`} name="maxValue" type="number" defaultValue={control.maxValue ?? ""} className={adminCompactInputClass} />
                              </div>
                            </div>
                          </td>
                          <td className={adminTableCellClass}>
                            <input form={`control-${control.id}`} name="defaultValue" defaultValue={control.defaultValue ?? ""} dir="ltr" className={`${adminCompactInputClass} text-left`} />
                            <input form={`control-${control.id}`} name="sortOrder" type="number" defaultValue={control.sortOrder} className={`${adminCompactInputClass} mt-2`} />
                          </td>
                          <td className={adminTableCellClass}>
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                              <input form={`control-${control.id}`} name="isActive" type="checkbox" defaultChecked={control.isActive} className="h-4 w-4 accent-slate-950" />
                              <AdminStatus status={control.isActive ? "ACTIVE" : "PAUSED"} />
                            </label>
                          </td>
                          <td className={adminTableCellClass}>
                            <div className="flex flex-wrap gap-2">
                              <button form={`control-${control.id}`} className={adminSecondaryActionClass}>
                                <Setting4 className="h-4 w-4" />
                                ذخیره
                              </button>
                              <ConfirmAction
                                action={deleteStyleControlAction}
                                fields={[{ name: "controlId", value: control.id }]}
                                title="کنترل حذف شود؟"
                                description="این گزینه از فرم سبک کاربر حذف می‌شود."
                                confirmLabel="حذف"
                                trigger={(open) => (
                                  <button type="button" onClick={open} className={adminDangerActionClass}>
                                    <Trash className="h-4 w-4" />
                                    حذف
                                  </button>
                                )}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </AdminDataTable>

                    <form action={createStyleControlAction} className="grid gap-2 border-t border-slate-200 p-4 md:grid-cols-[minmax(0,1fr)_160px_140px_100px_auto] md:items-end">
                      <input type="hidden" name="styleId" value={style.id} />
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        برچسب
                        <input name="label" placeholder="سایه نرم" className={adminCompactInputClass} />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        کلید
                        <input name="key" placeholder="softShadow" dir="ltr" className={`${adminCompactInputClass} text-left`} />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        نوع
                        <ControlTypeSelect defaultValue="CHOICE" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        ترتیب
                        <input name="sortOrder" type="number" defaultValue={style.controls.length * 10 + 10} className={adminCompactInputClass} />
                      </label>
                      <label className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-950">
                        <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-slate-950" />
                        فعال
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600 md:col-span-2">
                        گزینه‌ها
                        <input name="optionsJson" placeholder='[{"value":"low","label":"کم"}]' dir="ltr" className={`${adminCompactInputClass} text-left`} />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        پیش‌فرض
                        <input name="defaultValue" dir="ltr" className={`${adminCompactInputClass} text-left`} />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        کمینه
                        <input name="minValue" type="number" className={adminCompactInputClass} />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                        بیشینه
                        <input name="maxValue" type="number" className={adminCompactInputClass} />
                      </label>
                      <button className={adminPrimaryActionClass}>
                        <Add className="h-4 w-4" />
                        افزودن کنترل
                      </button>
                    </form>
                  </AdminPanel>
                </div>
              </section>
            );
          })}
        </div>
      </AdminPanel>
    </>
  );
}
