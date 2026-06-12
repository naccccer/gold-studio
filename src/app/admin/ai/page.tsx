import { Danger, Save2, TickCircle } from "vuesax-icons-react";
import {
  btnPrimary,
  cellClass,
  checkboxClass,
  ConsoleHeader,
  ConsoleTable,
  Disclosure,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  formatAdminDate,
  StatBar,
  StatusDot,
  Surface,
} from "@/features/admin/components/console";
import { updateProviderSettingsAction } from "@/features/admin/actions";
import { imageProviderLabel } from "@/lib/ai/provider";
import { AVALAI_IMAGE_MODELS, getImageProviderAttemptOrder, getProviderSettings, LIARA_IMAGE_MODELS } from "@/lib/ai/provider-settings";
import { db } from "@/lib/db";
import { ProviderSwitch } from "../provider/provider-switch";

export const dynamic = "force-dynamic";

function envIsSet(name: string) {
  return Boolean(process.env[name]?.trim());
}

export default async function AdminAiPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [events, failedToday, successToday, groupedFailures, providerSettings] = await Promise.all([
    db.providerEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
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
  const modelOrder = getImageProviderAttemptOrder(providerSettings);
  const modelOptions = selectedProvider === "avalai" ? AVALAI_IMAGE_MODELS : LIARA_IMAGE_MODELS;
  const envNames =
    selectedProvider === "avalai"
      ? ["AVALAI_API_KEY", "AVALAI_BASE_URL", "AVALAI_IMAGE_MODEL", "AVALAI_VISION_MODEL", "AVALAI_IMAGE_SIZE"]
      : ["LIARA_API_KEY", "LIARA_BASE_URL", "LIARA_IMAGE_MODEL", "LIARA_VISION_MODEL", "LIARA_IMAGE_SIZE"];
  const missingEnvCount = envNames.filter((name) => !envIsSet(name)).length;

  return (
    <>
      <ConsoleHeader
        title="موتور AI"
        meta={
          <>
            <span>
              Provider فعال: <strong className="font-semibold text-navy-950">{imageProviderLabel(selectedProvider)}</strong>
            </span>
            <span dir="ltr" className="text-slate-400">
              {providerSettings.activeModel}
            </span>
          </>
        }
      />

      <StatBar
        items={[
          { label: "موفق امروز", value: successToday, tone: "success" },
          { label: "ناموفق امروز", value: failedToday, tone: failedToday ? "danger" : "neutral" },
          {
            label: "Fallback خودکار",
            value: providerSettings.autoFallback ? "روشن" : "خاموش",
            tone: providerSettings.autoFallback ? "success" : "attention",
          },
          {
            label: "متغیر محیطی ناقص",
            value: missingEnvCount,
            tone: missingEnvCount ? "danger" : "success",
          },
        ]}
      />

      <Surface>
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy-950">پیکربندی تولید تصویر</h2>
          <p className="mt-0.5 text-xs text-slate-500">تغییرات بدون نیاز به restart اعمال می‌شود.</p>
        </div>
        <form action={updateProviderSettingsAction} className="grid gap-4 p-5">
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <ProviderSwitch selectedProvider={selectedProvider} />
            <Field label="مدل اصلی">
              <select name="activeModel" defaultValue={providerSettings.activeModel} className={fieldClass} dir="ltr">
                {modelOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Disclosure summary={`تنظیمات Fallback (${faNum(providerSettings.fallbackModels.length)} مدل انتخاب‌شده)`}>
            <div className="grid gap-3">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {modelOptions.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-xs text-navy-900" dir="ltr">
                    <input
                      type="checkbox"
                      name="fallbackModels"
                      value={item}
                      defaultChecked={providerSettings.fallbackModels.includes(item)}
                      className={checkboxClass}
                    />
                    <span className="min-w-0 truncate">{item}</span>
                  </label>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-medium text-navy-900">
                <input type="checkbox" name="autoFallback" defaultChecked={providerSettings.autoFallback} className={checkboxClass} />
                بعد از خطا به‌صورت خودکار مدل بعدی امتحان شود
              </label>
            </div>
          </Disclosure>

          <div>
            <button className={btnPrimary}>
              <Save2 className="h-4 w-4" />
              ذخیره پیکربندی
            </button>
          </div>
        </form>
      </Surface>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Disclosure summary={`ترتیب واقعی تلاش مدل‌ها (${faNum(modelOrder.length)})`}>
          <ol className="m-0 grid list-none gap-1.5 p-0">
            {modelOrder.map((attempt, index) => (
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

        <Disclosure summary={missingEnvCount ? `آمادگی محیط (${faNum(missingEnvCount)} مورد ناقص)` : "آمادگی محیط"}>
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
      </div>

      {groupedFailures.length > 0 ? (
        <Disclosure summary={`دلایل شکست پرتکرار (${faNum(groupedFailures.length)})`}>
          <div className="grid gap-1.5">
            {groupedFailures.map((item) => (
              <div key={`${item.provider}-${item.operation}-${item.model ?? "unknown"}`} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-slate-500" dir="ltr">
                  {item.provider} · {item.operation} · {item.model || "unknown"}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-rose-700">{faNum(item._count._all)}</span>
              </div>
            ))}
          </div>
        </Disclosure>
      ) : null}

      <Surface>
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy-950">رویدادهای اخیر</h2>
        </div>
        <ConsoleTable head={["وضعیت", "Provider", "پروژه", "جزئیات", "زمان"]} empty={<EmptyState title="رویدادی ثبت نشده است." />}>
          {events.map((event) => (
            <tr key={event.id}>
              <td className={cellClass}>
                <StatusDot status={event.status} />
              </td>
              <td className={cellClass} dir="ltr">
                {event.provider}
                <p className="text-xs text-slate-400">
                  {event.operation} · {event.model || "unknown"}
                </p>
              </td>
              <td className={cellClass}>
                {event.projectId ? (
                  <a href={`/admin/projects/${event.projectId}`} className="font-medium hover:text-navy-700 hover:underline">
                    {event.project?.title || event.projectId}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">بدون پروژه</span>
                )}
              </td>
              <td className={cellClass}>
                <p className="max-w-xl truncate text-xs text-slate-500">{event.errorMessage || event.statusDetail || "بدون جزئیات"}</p>
              </td>
              <td className={`${cellClass} text-xs text-slate-500`}>{formatAdminDate(event.createdAt)}</td>
            </tr>
          ))}
        </ConsoleTable>
      </Surface>
    </>
  );
}
