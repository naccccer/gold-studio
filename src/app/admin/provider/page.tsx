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
import { imageProviderLabel } from "@/lib/ai/provider";
import { AVALAI_IMAGE_MODELS, getImageProviderAttemptOrder, getProviderSettings, LIARA_IMAGE_MODELS } from "@/lib/ai/provider-settings";
import { db } from "@/lib/db";
import { ProviderSwitch } from "./provider-switch";

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
      by: ["provider", "operation", "model"],
      where: { status: "FAILED" },
      _count: { _all: true },
      orderBy: [{ provider: "asc" }, { operation: "asc" }, { model: "asc" }],
      take: 8,
    }),
    getProviderSettings(),
  ]);

  const selectedProvider = providerSettings.imageProvider;
  const providerLabel = imageProviderLabel(selectedProvider);
  const model = providerSettings.activeModel;
  const modelOrder = getImageProviderAttemptOrder(providerSettings);
  const activeModelOptions = selectedProvider === "avalai" ? AVALAI_IMAGE_MODELS : LIARA_IMAGE_MODELS;
  const fallbackModelOptions = selectedProvider === "avalai" ? AVALAI_IMAGE_MODELS : LIARA_IMAGE_MODELS;
  const quality =
    selectedProvider === "avalai"
      ? `${process.env.AVALAI_IMAGE_SIZE?.trim() || "2K"} / preset-driven`
      : process.env.LIARA_IMAGE_QUALITY?.trim() || process.env.GAPGPT_IMAGE_QUALITY?.trim() || "پیش‌فرض برنامه";
  const envItems =
    selectedProvider === "avalai"
      ? [
          ["IMAGE_PROVIDER", process.env.IMAGE_PROVIDER?.trim() || "liara"],
          ["ProviderSettings", selectedProvider],
          ["AVALAI_API_KEY", envStatus("AVALAI_API_KEY")],
          ["AVALAI_BASE_URL", envStatus("AVALAI_BASE_URL")],
          ["AVALAI_IMAGE_MODEL", process.env.AVALAI_IMAGE_MODEL?.trim() || "پیش‌فرض برنامه"],
          ["AVALAI_VISION_MODEL", process.env.AVALAI_VISION_MODEL?.trim() || "gemini-3.1-flash-lite"],
          ["AVALAI_IMAGE_SIZE", process.env.AVALAI_IMAGE_SIZE?.trim() || "2K"],
          ["Aspect source", "User preset: 1:1 / 9:16 / 16:9"],
          ["AVALAI_ASPECT_RATIO fallback", process.env.AVALAI_ASPECT_RATIO?.trim() || "1:1"],
        ]
      : [
          ["IMAGE_PROVIDER", process.env.IMAGE_PROVIDER?.trim() || "liara"],
          ["ProviderSettings", selectedProvider],
          ["LIARA_API_KEY", envStatus("LIARA_API_KEY")],
          ["LIARA_BASE_URL", envStatus("LIARA_BASE_URL")],
          ["LIARA_VISION_MODEL", process.env.LIARA_VISION_MODEL?.trim() || "google/gemini-2.0-flash-lite-001"],
          ["LIARA_IMAGE_SIZE", envStatus("LIARA_IMAGE_SIZE")],
          ["Preset sizes", "1:1 / 9:16 / 16:9"],
        ];

  return (
    <>
      <section className="grid gap-2.5 sm:grid-cols-5">
        <AdminMetric label="موفق امروز" value={successToday} />
        <AdminMetric label="ناموفق امروز" value={failedToday} />
        <AdminMetric label="Provider" value={providerLabel} />
        <AdminMetric label="مدل" value={model} />
        <AdminMetric label="کیفیت" value={quality} />
      </section>

      <AdminSection title="سلامت پیکربندی Provider" eyebrow="بدون تماس زنده با سرویس">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {envItems.map(([label, value]) => (
            <div key={label} className="rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/45 p-3">
              <p className="text-[11px] text-muted" dir="ltr">
                {label}
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                {value === "تنظیم نشده" ? (
                  <Danger className="h-4 w-4 text-danger" />
                ) : (
                  <TickCircle className="h-4 w-4 text-accent" />
                )}
                {value}
              </p>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="تنظیم مدل تولید تصویر" eyebrow="سوییچ زنده بدون تغییر env و بدون restart">
        <form action={updateProviderSettingsAction} className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-end">
          <ProviderSwitch selectedProvider={selectedProvider} />

          <label className={adminLabelClass}>
            مدل اصلی
            <select name="activeModel" defaultValue={providerSettings.activeModel} className={adminInputClass} dir="ltr">
              {activeModelOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2">
            <p className="text-xs font-medium text-muted">Fallback بعد از خطا</p>
            <div className="grid gap-2 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/45 p-3 md:grid-cols-3">
              {fallbackModelOptions.map((item) => (
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
              Order: {modelOrder.map((item) => `${item.provider}/${item.model}`).join(" -> ")}
            </p>
            <p className="text-[11px] text-muted">
              اگر provider انتخابی جواب ندهد، fallback خودکار به provider دیگر می‌رود و gpt-image-2 آخرین گزینه است.
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
              <AdminRow key={`${item.provider}-${item.operation}-${item.model ?? "unknown"}`} className="md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.provider} / {item.operation}</p>
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
                    {event.provider} / {event.operation} · {event.project?.title || event.projectId || "بدون پروژه"}
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
