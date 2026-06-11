import { Danger, Save2, TickCircle } from "vuesax-icons-react";
import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryActionClass,
  adminTableCellClass,
  AdminDataTable,
  AdminEmptyState,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import { updateProviderSettingsAction } from "@/features/admin/actions";
import { imageProviderLabel } from "@/lib/ai/provider";
import { AVALAI_IMAGE_MODELS, getImageProviderAttemptOrder, getProviderSettings, LIARA_IMAGE_MODELS } from "@/lib/ai/provider-settings";
import { db } from "@/lib/db";
import { ProviderSwitch } from "../provider/provider-switch";

export const dynamic = "force-dynamic";

function envStatus(name: string) {
  return process.env[name]?.trim() ? "تنظیم شده" : "تنظیم نشده";
}

export default async function AdminAiPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [events, failedToday, successToday, groupedFailures, providerSettings] = await Promise.all([
    db.providerEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { project: { select: { title: true, id: true } } },
    }),
    db.providerEvent.count({ where: { status: "FAILED", createdAt: { gte: today } } }),
    db.providerEvent.count({ where: { status: "SUCCESS", createdAt: { gte: today } } }),
    db.providerEvent.groupBy({
      by: ["provider", "operation", "model"],
      where: { status: "FAILED" },
      _count: { _all: true },
      orderBy: [{ provider: "asc" }, { operation: "asc" }, { model: "asc" }],
      take: 12,
    }),
    getProviderSettings(),
  ]);

  const selectedProvider = providerSettings.imageProvider;
  const providerLabel = imageProviderLabel(selectedProvider);
  const modelOrder = getImageProviderAttemptOrder(providerSettings);
  const activeModelOptions = selectedProvider === "avalai" ? AVALAI_IMAGE_MODELS : LIARA_IMAGE_MODELS;
  const fallbackModelOptions = selectedProvider === "avalai" ? AVALAI_IMAGE_MODELS : LIARA_IMAGE_MODELS;
  const envItems =
    selectedProvider === "avalai"
      ? [
          ["AVALAI_API_KEY", envStatus("AVALAI_API_KEY")],
          ["AVALAI_BASE_URL", envStatus("AVALAI_BASE_URL")],
          ["AVALAI_IMAGE_MODEL", process.env.AVALAI_IMAGE_MODEL?.trim() || "پیش‌فرض برنامه"],
          ["AVALAI_VISION_MODEL", process.env.AVALAI_VISION_MODEL?.trim() || "gemini-3.1-flash-lite"],
          ["AVALAI_IMAGE_SIZE", process.env.AVALAI_IMAGE_SIZE?.trim() || "2K"],
        ]
      : [
          ["LIARA_API_KEY", envStatus("LIARA_API_KEY")],
          ["LIARA_BASE_URL", envStatus("LIARA_BASE_URL")],
          ["LIARA_IMAGE_MODEL", process.env.LIARA_IMAGE_MODEL?.trim() || process.env.GAPGPT_IMAGE_MODEL?.trim() || "پیش‌فرض برنامه"],
          ["LIARA_VISION_MODEL", process.env.LIARA_VISION_MODEL?.trim() || "google/gemini-2.0-flash-lite-001"],
          ["LIARA_IMAGE_SIZE", envStatus("LIARA_IMAGE_SIZE")],
        ];

  return (
    <>
      <AdminPageHeader
        title="عملیات AI"
        description="کنترل provider، مدل‌ها، fallback، readiness محیط و eventهای generation."
      />

      <AdminKpiStrip>
        <AdminKpi label="Provider" value={providerLabel} />
        <AdminKpi label="مدل اصلی" value={providerSettings.activeModel} />
        <AdminKpi label="Fallback" value={providerSettings.autoFallback ? "روشن" : "خاموش"} tone={providerSettings.autoFallback ? "success" : "attention"} />
        <AdminKpi label="موفق امروز" value={successToday} tone="success" />
        <AdminKpi label="ناموفق امروز" value={failedToday} tone={failedToday ? "danger" : "neutral"} />
        <AdminKpi label="Event اخیر" value={events.length} />
      </AdminKpiStrip>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <AdminPanel title="تنظیم مدل تولید تصویر" description="سوییچ DB-backed بدون تغییر env و بدون restart.">
          <form action={updateProviderSettingsAction} className="grid gap-4 p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
              <ProviderSwitch selectedProvider={selectedProvider} />
              <label className={adminLabelClass}>
                مدل اصلی
                <select name="activeModel" defaultValue={providerSettings.activeModel} className={adminInputClass} dir="ltr">
                  {activeModelOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-2">
              <p className="text-xs font-semibold text-slate-600">Fallback بعد از خطا</p>
              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-3">
                {fallbackModelOptions.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-xs text-slate-800" dir="ltr">
                    <input
                      type="checkbox"
                      name="fallbackModels"
                      value={item}
                      defaultChecked={providerSettings.fallbackModels.includes(item)}
                      className="h-4 w-4 accent-slate-950"
                    />
                    <span className="min-w-0 truncate">{item}</span>
                  </label>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input type="checkbox" name="autoFallback" defaultChecked={providerSettings.autoFallback} className="h-4 w-4 accent-slate-950" />
                fallback خودکار روشن باشد
              </label>
            </div>

            <button className={adminPrimaryActionClass}>
              <Save2 className="h-4 w-4" />
              ذخیره تنظیمات
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title="Readiness محیط" description="بدون تماس زنده با provider.">
          <div className="grid gap-2 p-4">
            {envItems.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500" dir="ltr">{label}</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                  {value === "تنظیم نشده" ? <Danger className="h-4 w-4 text-rose-700" /> : <TickCircle className="h-4 w-4 text-emerald-700" />}
                  {value}
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <AdminPanel title="ترتیب واقعی تلاش">
          <div className="divide-y divide-slate-100">
            {modelOrder.map((attempt, index) => (
              <div key={`${attempt.provider}-${attempt.model}-${index}`} className="grid gap-2 px-4 py-3 md:grid-cols-[64px_110px_minmax(0,1fr)]">
                <p className="text-xs font-semibold text-slate-500">#{(index + 1).toLocaleString("fa-IR")}</p>
                <p className="font-semibold text-slate-950" dir="ltr">{attempt.provider}</p>
                <p className="truncate text-sm text-slate-600" dir="ltr">{attempt.model}</p>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="دلایل شکست پرتکرار">
          <AdminDataTable headers={["Provider", "Operation", "Model", "تعداد"]} empty={<AdminEmptyState title="شکستی ثبت نشده است." />}>
            {groupedFailures.map((item) => (
              <tr key={`${item.provider}-${item.operation}-${item.model ?? "unknown"}`}>
                <td className={adminTableCellClass} dir="ltr">{item.provider}</td>
                <td className={adminTableCellClass} dir="ltr">{item.operation}</td>
                <td className={adminTableCellClass} dir="ltr">{item.model || "unknown"}</td>
                <td className={adminTableCellClass}>{item._count._all.toLocaleString("fa-IR")}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>
      </div>

      <AdminPanel title="رویدادهای اخیر Provider">
        <AdminDataTable headers={["وضعیت", "Provider", "پروژه", "جزئیات", "زمان"]} empty={<AdminEmptyState title="event ثبت نشده است." />}>
          {events.map((event) => (
            <tr key={event.id}>
              <td className={adminTableCellClass}><AdminStatus status={event.status} /></td>
              <td className={adminTableCellClass} dir="ltr">{event.provider}<p className="text-xs text-slate-500">{event.operation} · {event.model || "unknown"}</p></td>
              <td className={adminTableCellClass}>
                {event.projectId ? (
                  <a href={`/admin/projects/${event.projectId}`} className="font-semibold text-slate-950 hover:underline">{event.project?.title || event.projectId}</a>
                ) : (
                  "بدون پروژه"
                )}
              </td>
              <td className={adminTableCellClass}>
                <p className="max-w-xl truncate text-xs text-slate-600">{event.errorMessage || event.statusDetail || "بدون جزئیات"}</p>
              </td>
              <td className={adminTableCellClass}>{formatAdminDate(event.createdAt)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>
    </>
  );
}
