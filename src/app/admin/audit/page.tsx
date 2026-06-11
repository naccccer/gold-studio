import {
  adminInputClass,
  adminPrimaryActionClass,
  adminTableCellClass,
  AdminDataTable,
  AdminEmptyState,
  AdminFilterBar,
  AdminPageHeader,
  AdminPanel,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
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
      <AdminPageHeader title="Audit عملیات ادمین" description="ردپای تغییرات حساس: پرداخت، اعتبار، نقش، سبک‌ها، provider و عملیات پشتیبانی." />

      <AdminFilterBar>
        <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <input name="q" defaultValue={q} placeholder="جست‌وجو در عملیات، هدف، خلاصه یا ادمین" className={adminInputClass} />
          <select name="targetType" defaultValue={targetType ?? ""} className={adminInputClass}>
            <option value="">همه هدف‌ها</option>
            {targetTypes.map((item) => (
              <option key={item.targetType} value={item.targetType}>{item.targetType}</option>
            ))}
          </select>
          <input name="action" defaultValue={action} placeholder="action مثل package.update" className={`${adminInputClass} text-left`} dir="ltr" />
          <button className={adminPrimaryActionClass}>اعمال</button>
        </form>
      </AdminFilterBar>

      <AdminPanel title="رویدادها" description={`${events.length.toLocaleString("fa-IR")} مورد اخیر`}>
        <AdminDataTable headers={["عملیات", "هدف", "خلاصه", "ادمین", "زمان"]} empty={<AdminEmptyState title="رویدادی با این فیلتر پیدا نشد." />}>
          {events.map((event) => (
            <tr key={event.id}>
              <td className={adminTableCellClass}>
                <p className="font-semibold text-foreground" dir="ltr">{event.action}</p>
              </td>
              <td className={adminTableCellClass}>
                <p className="font-semibold text-foreground" dir="ltr">{event.targetType}</p>
                <p className="max-w-[180px] truncate text-xs text-muted" dir="ltr">{event.targetId}</p>
              </td>
              <td className={adminTableCellClass}>
                <p className="max-w-md truncate text-sm text-foreground">{event.summary}</p>
              </td>
              <td className={adminTableCellClass}>
                {event.actorAdmin ? (
                  <>
                    <p className="font-semibold text-foreground">{getUserDisplayName(event.actorAdmin)}</p>
                    <p className="text-xs text-muted" dir="ltr">{getUserIdentifier(event.actorAdmin)}</p>
                  </>
                ) : (
                  "سیستم"
                )}
              </td>
              <td className={adminTableCellClass}>{formatAdminDate(event.createdAt)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>
    </>
  );
}
