import {
  btnSecondary,
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  EmptyState,
  faNum,
  inlineFieldClass,
  formatAdminDate,
  Surface,
} from "@/features/admin/components/console";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminAuditPageProps = {
  searchParams?: Promise<{ q?: string; targetType?: string; action?: string }>;
};

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim();
  const targetType = params?.targetType?.trim();
  const action = params?.action?.trim();

  const where = {
    ...(targetType ? { targetType } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q } },
            { targetType: { contains: q } },
            { targetId: { contains: q } },
            { summary: { contains: q } },
            { actorAdmin: { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } },
          ],
        }
      : {}),
  };

  const [events, targetTypes] = await Promise.all([
    db.adminAuditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 120,
      include: { actorAdmin: { select: { name: true, email: true, phone: true } } },
    }),
    db.adminAuditEvent.groupBy({ by: ["targetType"], orderBy: { targetType: "asc" } }),
  ]);

  return (
    <>
      <ConsoleHeader title="ردپای تغییرات" meta={<span>{faNum(events.length)} رویداد اخیر</span>} />

      <form className="flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={q} placeholder="جست‌وجو در عملیات، هدف یا ادمین" className={`${inlineFieldClass} w-64`} />
        <select name="targetType" defaultValue={targetType ?? ""} className={`${inlineFieldClass} w-40`}>
          <option value="">همه هدف‌ها</option>
          {targetTypes.map((item) => (
            <option key={item.targetType} value={item.targetType}>
              {item.targetType}
            </option>
          ))}
        </select>
        <input name="action" defaultValue={action} placeholder="package.update" dir="ltr" className={`${inlineFieldClass} w-44 text-left`} />
        <button className={`${btnSecondary} h-8`}>اعمال</button>
      </form>

      <Surface>
        <ConsoleTable
          head={["عملیات", "هدف", "خلاصه", "ادمین", "زمان"]}
          empty={<EmptyState title="رویدادی با این فیلتر پیدا نشد." />}
        >
          {events.map((event) => (
            <tr key={event.id}>
              <td className={cellClass}>
                <p className="font-medium" dir="ltr">
                  {event.action}
                </p>
              </td>
              <td className={cellClass}>
                <p dir="ltr">{event.targetType}</p>
                <p className="max-w-44 truncate text-xs text-slate-400" dir="ltr">
                  {event.targetId}
                </p>
              </td>
              <td className={cellClass}>
                <p className="max-w-md truncate">{event.summary}</p>
              </td>
              <td className={cellClass}>
                {event.actorAdmin ? (
                  <>
                    <p className="font-medium">{getUserDisplayName(event.actorAdmin)}</p>
                    <p className="text-xs text-slate-400" dir="ltr">
                      {getUserIdentifier(event.actorAdmin)}
                    </p>
                  </>
                ) : (
                  "سیستم"
                )}
              </td>
              <td className={`${cellClass} text-xs text-slate-500`}>{formatAdminDate(event.createdAt)}</td>
            </tr>
          ))}
        </ConsoleTable>
      </Surface>
    </>
  );
}
