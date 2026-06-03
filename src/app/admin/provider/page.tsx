import { Danger, TickCircle } from "vuesax-icons-react";
import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryActionClass,
  AdminMetric,
  AdminRow,
  AdminSection,
  AdminStatus,
  EmptyAdminState,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import { updateProviderSettingsAction } from "@/features/admin/actions";
import { getImageModelAttemptOrder, getProviderSettings, SUPPORTED_IMAGE_MODELS } from "@/lib/ai/provider-settings";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function envStatus(name: string) {
  return process.env[name]?.trim() ? "تنظیم شده" : "تنظیم نشده";
}

export default async function AdminProviderPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [events, failedToday, successToday, groupedFailures, providerSettings] = await Promise.all([
    db.providerEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { project: { select: { title: true, id: true } } },
    }),
    db.providerEvent.count({ where: { status: "FAILED", createdAt: { gte: today } } }),
    db.providerEvent.count({ where: { status: "SUCCESS", createdAt: { gte: today } } }),
    db.providerEvent.groupBy({
      by: ["operation", "model"],
      where: { status: "FAILED" },
      _count: { _all: true },
      orderBy: [{ operation: "asc" }, { model: "asc" }],
      take: 8,
    }),
    getProviderSettings(),
  ]);

  const model = providerSettings.activeModel;
  const modelOrder = getImageModelAttemptOrder(providerSettings);
  const quality = process.env.LIARA_IMAGE_QUALITY?.trim() || process.env.GAPGPT_IMAGE_QUALITY?.trim() || "پیش‌فرض برنامه";

  return (
    <>
      <section className="grid gap-2.5 sm:grid-cols-4">
        <AdminMetric label="موفق امروز" value={successToday} />
        <AdminMetric label="ناموفق امروز" value={failedToday} />
        <AdminMetric label="مدل" value={model} />
        <AdminMetric label="کیفیت" value={quality} />
      </section>

      <AdminSection title="سلامت پیکربندی Provider" eyebrow="بدون تماس زنده با سرویس">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["LIARA_API_KEY", envStatus("LIARA_API_KEY")],
            ["LIARA_BASE_URL", envStatus("LIARA_BASE_URL")],
            ["LIARA_IMAGE_SIZE", envStatus("LIARA_IMAGE_SIZE")],
            ["Preset sizes", "1:1 / 9:16 / 16:9"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/45 p-3">
              <p className="text-[11px] text-muted" dir="ltr">
                {label}
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                {value === "تنظیم نشده" ? <Danger className="h-4 w-4 text-danger" /> : <TickCircle className="h-4 w-4 text-accent" />}
                {value}
              </p>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="تنظیم مدل تولید تصویر" eyebrow="سوییچ زنده بدون تغییر env و بدون restart">
        <form action={updateProviderSettingsAction} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-end">
          <label className={adminLabelClass}>
            مدل اصلی
            <select name="activeModel" defaultValue={providerSettings.activeModel} className={adminInputClass} dir="ltr">
              {SUPPORTED_IMAGE_MODELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2">
            <p className="text-xs font-medium text-muted">Fallback بعد از خطا</p>
            <div className="grid gap-2 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/45 p-3 md:grid-cols-3">
              {SUPPORTED_IMAGE_MODELS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-xs text-foreground" dir="ltr">
                  <input
                    type="checkbox"
                    name="fallbackModels"
                    value={item}
                    defaultChecked={providerSettings.fallbackModels.includes(item)}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  <span className="min-w-0 truncate">{item}</span>
                </label>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
              <input type="checkbox" name="autoFallback" defaultChecked={providerSettings.autoFallback} className="h-4 w-4 accent-[var(--color-accent)]" />
              fallback خودکار روشن باشد
            </label>
            <p className="text-[11px] text-muted" dir="ltr">
              Order: {modelOrder.join(" -> ")}
            </p>
          </div>

          <button className={adminPrimaryActionClass}>ذخیره تنظیمات</button>
        </form>
      </AdminSection>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <AdminSection title="دلایل شکست پرتکرار" eyebrow="گروه‌بندی عملیاتی">
          {groupedFailures.length === 0 ? (
            <EmptyAdminState>هنوز شکست provider ثبت نشده است.</EmptyAdminState>
          ) : (
            groupedFailures.map((item) => (
              <AdminRow key={`${item.operation}-${item.model ?? "unknown"}`} className="md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.operation}</p>
                  <p className="text-xs text-muted">{item.model || "model unknown"}</p>
                </div>
                <AdminMetric label="تعداد" value={item._count._all} />
              </AdminRow>
            ))
          )}
        </AdminSection>

        <AdminSection title="رویدادهای اخیر Provider" eyebrow="موفق و ناموفق">
          {events.length === 0 ? (
            <EmptyAdminState>هنوز رویدادی ثبت نشده است.</EmptyAdminState>
          ) : (
            events.map((event) => (
              <AdminRow key={event.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {event.operation} · {event.project?.title || event.projectId || "بدون پروژه"}
                  </p>
                  <p className="truncate text-xs text-muted">{event.errorMessage || event.statusDetail || event.model || "بدون جزئیات"}</p>
                </div>
                <p className="text-xs text-muted">{formatAdminDate(event.createdAt)}</p>
                <AdminStatus status={event.status} />
              </AdminRow>
            ))
          )}
        </AdminSection>
      </div>
    </>
  );
}
