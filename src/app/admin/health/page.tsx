import { Danger, TickCircle } from "vuesax-icons-react";
import {
  AdminDataTable,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  adminTableCellClass,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import { imageProviderLabel } from "@/lib/ai/provider";
import { getImageProviderAttemptOrder, getProviderSettings } from "@/lib/ai/provider-settings";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function envStatus(name: string) {
  return process.env[name]?.trim() ? "تنظیم شده" : "تنظیم نشده";
}

export default async function AdminHealthPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dbOk = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  const [providerSettings, successToday, failedToday, recentFailures, rateBuckets] = await Promise.all([
    getProviderSettings(),
    db.providerEvent.count({ where: { status: "SUCCESS", createdAt: { gte: today } } }),
    db.providerEvent.count({ where: { status: "FAILED", createdAt: { gte: today } } }),
    db.providerEvent.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { project: { select: { id: true, title: true } } },
    }),
    db.rateLimitBucket.findMany({ orderBy: { updatedAt: "desc" }, take: 12 }),
  ]);

  const attemptOrder = getImageProviderAttemptOrder(providerSettings);
  const envItems =
    providerSettings.imageProvider === "avalai"
      ? ["AVALAI_API_KEY", "AVALAI_BASE_URL", "AVALAI_IMAGE_MODEL", "AVALAI_VISION_MODEL", "AVALAI_IMAGE_SIZE"]
      : ["LIARA_API_KEY", "LIARA_BASE_URL", "LIARA_IMAGE_MODEL", "LIARA_VISION_MODEL", "LIARA_IMAGE_SIZE"];

  return (
    <>
      <AdminPageHeader
        title="سلامت سیستم"
        description="نمای سریع از دیتابیس، تنظیمات provider، خطاهای امروز و bucketهای rate limit."
      />

      <AdminKpiStrip>
        <AdminKpi label="Database" value={dbOk ? "OK" : "DOWN"} tone={dbOk ? "success" : "danger"} />
        <AdminKpi label="Provider فعال" value={imageProviderLabel(providerSettings.imageProvider)} />
        <AdminKpi label="موفق امروز" value={successToday} tone="success" />
        <AdminKpi label="ناموفق امروز" value={failedToday} tone={failedToday ? "danger" : "neutral"} />
        <AdminKpi label="مدل اصلی" value={providerSettings.activeModel} />
        <AdminKpi label="Fallback" value={providerSettings.autoFallback ? "روشن" : "خاموش"} tone={providerSettings.autoFallback ? "success" : "attention"} />
      </AdminKpiStrip>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <AdminPanel title="پیکربندی محیط" description="این بخش تماس زنده با provider نمی‌گیرد؛ فقط readiness را نشان می‌دهد.">
          <div className="grid gap-2 p-4 md:grid-cols-2">
            {envItems.map((name) => {
              const status = envStatus(name);
              return (
                <div key={name} className="rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/45 px-3 py-2">
                  <p className="text-[11px] text-muted" dir="ltr">{name}</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                    {status === "تنظیم شده" ? <TickCircle className="h-4 w-4 text-accent" /> : <Danger className="h-4 w-4 text-danger" />}
                    {status}
                  </p>
                </div>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel title="ترتیب تلاش مدل‌ها" description="همان order واقعی generation با fallback بین Liara و Avalai.">
          <div className="divide-y divide-border/60">
            {attemptOrder.map((attempt, index) => (
              <div key={`${attempt.provider}-${attempt.model}-${index}`} className="grid gap-2 px-4 py-3 md:grid-cols-[80px_120px_minmax(0,1fr)]">
                <p className="text-xs font-semibold text-muted">#{(index + 1).toLocaleString("fa-IR")}</p>
                <p className="font-semibold text-foreground" dir="ltr">{attempt.provider}</p>
                <p className="truncate text-sm text-muted" dir="ltr">{attempt.model}</p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel title="خطاهای اخیر Provider">
          <AdminDataTable headers={["Provider", "عملیات", "پروژه", "زمان"]}>
            {recentFailures.map((event) => (
              <tr key={event.id}>
                <td className={adminTableCellClass} dir="ltr">{event.provider}<p className="text-xs text-muted">{event.model || "model unknown"}</p></td>
                <td className={adminTableCellClass}>
                  <AdminStatus status={event.status} />
                  <p className="mt-1 max-w-sm truncate text-xs text-danger">{event.errorMessage || event.statusDetail || "بدون جزئیات"}</p>
                </td>
                <td className={adminTableCellClass}>{event.project?.title || event.projectId || "بدون پروژه"}</td>
                <td className={adminTableCellClass}>{formatAdminDate(event.createdAt)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Rate limit buckets">
          <AdminDataTable headers={["کلید", "تعداد", "Reset", "آپدیت"]}>
            {rateBuckets.map((bucket) => (
              <tr key={bucket.key}>
                <td className={adminTableCellClass} dir="ltr">{bucket.key}</td>
                <td className={adminTableCellClass}>{bucket.count.toLocaleString("fa-IR")}</td>
                <td className={adminTableCellClass}>{formatAdminDate(bucket.resetAt)}</td>
                <td className={adminTableCellClass}>{formatAdminDate(bucket.updatedAt)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>
      </div>
    </>
  );
}
