import { Danger, TickCircle } from "vuesax-icons-react";
import {
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  Disclosure,
  EmptyState,
  faNum,
  formatAdminDate,
  StatBar,
  StatusDot,
  Surface,
} from "@/features/admin/components/console";
import { imageProviderLabel } from "@/lib/ai/provider";
import { getImageProviderAttemptOrder, getProviderSettings } from "@/lib/ai/provider-settings";
import { db } from "@/lib/db";
import { getDetailedHealthReport } from "@/lib/health";

export const dynamic = "force-dynamic";

function envIsSet(name: string) {
  return Boolean(process.env[name]?.trim());
}

export default async function AdminHealthPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [health, providerSettings, successToday, failedToday, recentFailures, rateBuckets] = await Promise.all([
    getDetailedHealthReport(),
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
  const envNames =
    providerSettings.imageProvider === "avalai"
      ? ["AVALAI_API_KEY", "AVALAI_BASE_URL", "AVALAI_IMAGE_MODEL", "AVALAI_VISION_MODEL", "AVALAI_IMAGE_SIZE"]
      : ["LIARA_API_KEY", "LIARA_BASE_URL", "LIARA_IMAGE_MODEL", "LIARA_VISION_MODEL", "LIARA_IMAGE_SIZE"];
  const missingEnvCount = envNames.filter((name) => !envIsSet(name)).length;
  const dbOk = health.database.ok;
  const generation = health.generation;

  return (
    <>
      <ConsoleHeader
        title="سلامت سیستم"
        meta={
          dbOk && failedToday === 0 && missingEnvCount === 0 ? (
            <span className="font-medium text-emerald-700">همه سرویس‌ها سالم هستند.</span>
          ) : (
            <span>برخی موارد نیاز به بررسی دارند.</span>
          )
        }
      />

      <StatBar
        items={[
          { label: "دیتابیس", value: dbOk ? "سالم" : "قطع", tone: dbOk ? "success" : "danger" },
          { label: "Provider فعال", value: imageProviderLabel(providerSettings.imageProvider) },
          { label: "موفق امروز", value: successToday, tone: "success" },
          { label: "ناموفق امروز", value: failedToday, tone: failedToday ? "danger" : "neutral" },
          { label: "متغیر محیطی ناقص", value: missingEnvCount, tone: missingEnvCount ? "danger" : "success" },
          { label: "پروژه‌های در صف", value: generation?.queuedProjects ?? "n/a", tone: generation?.queuedProjects ? "attention" : "neutral" },
          { label: "پروژه‌های در حال پردازش", value: generation?.processingProjects ?? "n/a", tone: generation?.staleProcessingProjects ? "danger" : "neutral" },
          { label: "Storage", value: health.storage.driver },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Disclosure summary={missingEnvCount ? `پیکربندی محیط (${faNum(missingEnvCount)} مورد ناقص)` : "پیکربندی محیط"} defaultOpen={missingEnvCount > 0}>
          <div className="grid gap-1.5">
            {envNames.map((name) => {
              const ok = envIsSet(name);
              return (
                <div key={name} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500" dir="ltr">
                    {name}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 font-medium ${ok ? "text-emerald-700" : "text-rose-700"}`}>
                    {ok ? <TickCircle className="h-3.5 w-3.5" /> : <Danger className="h-3.5 w-3.5" />}
                    {ok ? "تنظیم شده" : "تنظیم نشده"}
                  </span>
                </div>
              );
            })}
          </div>
        </Disclosure>

        <Disclosure summary={`ترتیب تلاش مدل‌ها (${faNum(attemptOrder.length)})`}>
          <ol className="m-0 grid list-none gap-1.5 p-0">
            {attemptOrder.map((attempt, index) => (
              <li key={`${attempt.provider}-${attempt.model}-${index}`} className="flex items-center gap-3 text-xs">
                <span className="w-6 shrink-0 tabular-nums text-slate-400">{faNum(index + 1)}</span>
                <span className="w-16 shrink-0 font-medium text-navy-950" dir="ltr">
                  {attempt.provider}
                </span>
                <span className="min-w-0 truncate text-slate-500" dir="ltr">
                  {attempt.model}
                </span>
              </li>
            ))}
          </ol>
        </Disclosure>
      </div>

      <Surface>
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy-950">خطاهای اخیر Provider</h2>
        </div>
        <ConsoleTable head={["Provider", "وضعیت", "پروژه", "زمان"]} empty={<EmptyState title="خطایی ثبت نشده است." />}>
          {recentFailures.map((event) => (
            <tr key={event.id}>
              <td className={cellClass} dir="ltr">
                {event.provider}
                <p className="text-xs text-slate-400">{event.model || "model unknown"}</p>
              </td>
              <td className={cellClass}>
                <StatusDot status={event.status} />
                <p className="mt-0.5 max-w-sm truncate text-xs text-rose-600">{event.errorMessage || event.statusDetail || "بدون جزئیات"}</p>
              </td>
              <td className={cellClass}>{event.project?.title || event.projectId || "بدون پروژه"}</td>
              <td className={`${cellClass} text-xs text-slate-500`}>{formatAdminDate(event.createdAt)}</td>
            </tr>
          ))}
        </ConsoleTable>
      </Surface>

      <Disclosure summary={`Rate limit buckets (${faNum(rateBuckets.length)})`}>
        {rateBuckets.length === 0 ? (
          <EmptyState title="باکتی ثبت نشده است." />
        ) : (
          <div className="divide-y divide-slate-100">
            {rateBuckets.map((bucket) => (
              <div key={bucket.key} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs first:pt-0 last:pb-0">
                <span className="min-w-0 truncate text-slate-500" dir="ltr">
                  {bucket.key}
                </span>
                <span className="flex shrink-0 items-center gap-4 text-slate-400">
                  <span className="font-medium tabular-nums text-navy-950">{faNum(bucket.count)}</span>
                  <span>بازنشانی {formatAdminDate(bucket.resetAt)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Disclosure>
    </>
  );
}
