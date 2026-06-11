import Link from "next/link";
import { ReceiptText, Refresh, TickCircle } from "vuesax-icons-react";
import {
  adminDangerActionClass,
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
  formatIrr,
} from "@/features/admin/components/admin-ui";
import { approvePurchaseRequestAction, rejectPurchaseRequestAction, retryAdminProjectAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    userCount,
    activeSubscriptionCount,
    pendingPurchaseCount,
    openTicketCount,
    activeGenerationCount,
    failedGenerationCount,
    providerFailureTodayCount,
    pendingPurchases,
    failedProjects,
    activeProjects,
    openTickets,
    lowCreditUsers,
    recentAuditEvents,
  ] = await Promise.all([
    db.user.count(),
    db.userSubscription.count({ where: { status: "ACTIVE", currentPeriodEnd: { gt: new Date() } } }),
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
    db.supportTicket.count({ where: { status: { not: "CLOSED" } } }),
    db.project.count({ where: { status: { in: ["QUEUED", "PROCESSING"] }, archivedAt: null } }),
    db.project.count({ where: { status: "FAILED", archivedAt: null } }),
    db.providerEvent.count({ where: { status: "FAILED", createdAt: { gte: today } } }),
    db.purchaseRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 6,
      include: { user: true, package: true },
    }),
    db.project.findMany({
      where: { status: "FAILED", archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { user: true, style: { select: { name: true } } },
    }),
    db.project.findMany({
      where: { status: { in: ["QUEUED", "PROCESSING"] }, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { user: true, style: { select: { name: true } } },
    }),
    db.supportTicket.findMany({
      where: { status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { user: { select: { name: true, email: true, phone: true } } },
    }),
    db.user.findMany({
      where: { credits: { lte: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { _count: { select: { projects: true, assets: true } } },
    }),
    db.adminAuditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actorAdmin: { select: { name: true, email: true, phone: true } } },
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="نمای کلی عملیات"
        description="اولویت این صفحه تشخیص سریع ریسک است: پرداخت‌های منتظر، تولیدهای گیرکرده، خطای provider، تیکت‌های باز و عملیات اخیر."
        actions={
          <>
            <Link href="/admin/health" className={adminPrimaryActionClass}>
              <TickCircle aria-hidden="true" className="h-4 w-4" />
              سلامت سیستم
            </Link>
            <Link href="/admin/audit" className={adminSecondaryLinkClass}>
              Audit
            </Link>
          </>
        }
      />

      <AdminKpiStrip>
        <AdminKpi label="کاربران" value={userCount} />
        <AdminKpi label="اشتراک فعال" value={activeSubscriptionCount} />
        <AdminKpi label="رسید در انتظار" value={pendingPurchaseCount} tone={pendingPurchaseCount ? "attention" : "neutral"} />
        <AdminKpi label="تیکت باز" value={openTicketCount} tone={openTicketCount ? "attention" : "neutral"} />
        <AdminKpi label="صف/پردازش" value={activeGenerationCount} tone={activeGenerationCount ? "attention" : "neutral"} />
        <AdminKpi label="شکست فعال" value={failedGenerationCount} tone={failedGenerationCount ? "danger" : "neutral"} hint={`${providerFailureTodayCount.toLocaleString("fa-IR")} خطای provider امروز`} />
      </AdminKpiStrip>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <AdminPanel
          title="رسیدهای خرید"
          description="تایید رسید، اعتبار یا اشتراک را برای کاربر فعال می‌کند."
          actions={<Link href="/admin/billing" className={adminSecondaryLinkClass}>همه پرداخت‌ها</Link>}
        >
          <AdminDataTable
            headers={["درخواست", "کاربر", "مبلغ", "رسید", "عملیات"]}
            empty={<AdminEmptyState title="رسید منتظر تایید نداریم." />}
          >
            {pendingPurchases.map((request) => (
              <tr key={request.id}>
                <td className={adminTableCellClass}>
                  <p className="font-semibold text-foreground">{request.package.title}</p>
                  <p className="text-xs text-muted">{formatAdminDate(request.createdAt)}</p>
                </td>
                <td className={adminTableCellClass}>
                  <Link href={`/admin/users/${request.userId}`} className="font-semibold text-foreground hover:underline">
                    {getUserDisplayName(request.user)}
                  </Link>
                  <p className="text-xs text-muted" dir="ltr">{getUserIdentifier(request.user)}</p>
                </td>
                <td className={adminTableCellClass}>{formatIrr(request.amount, request.currency)}</td>
                <td className={adminTableCellClass}>
                  {storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl) ? (
                    <a href={storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl) ?? ""} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-accent-deep">
                      <ReceiptText className="h-3.5 w-3.5" />
                      مشاهده
                    </a>
                  ) : (
                    <span className="text-xs text-danger">بدون رسید</span>
                  )}
                </td>
                <td className={adminTableCellClass}>
                  <div className="flex flex-wrap gap-2">
                    <form action={approvePurchaseRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button className={adminPrimaryActionClass}>تایید</button>
                    </form>
                    <form action={rejectPurchaseRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button className={adminDangerActionClass}>رد</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="شکست‌های تولید" description="مواردی که باید قبل از لانچ علت‌یابی شوند.">
          <div className="divide-y divide-border/60">
            {failedProjects.length === 0 ? (
              <div className="p-4"><AdminEmptyState title="پروژه ناموفق فعال وجود ندارد." /></div>
            ) : (
              failedProjects.map((project) => (
                <div key={project.id} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <Link href={`/admin/projects/${project.id}`} className="font-semibold text-foreground hover:underline">
                      {project.title || "پروژه بدون عنوان"}
                    </Link>
                    <p className="truncate text-xs text-muted">{getUserDisplayName(project.user)} · {project.style.name}</p>
                    <p className="truncate text-xs text-danger">{project.errorMessage || "خطای ثبت‌شده ندارد"}</p>
                  </div>
                  <form action={retryAdminProjectAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className={adminPrimaryActionClass}>
                      <Refresh className="h-3.5 w-3.5" />
                      تلاش دوباره
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminPanel title="صف تولید" description="آخرین پروژه‌های در صف یا پردازش.">
          <div className="divide-y divide-border/60">
            {activeProjects.length === 0 ? (
              <div className="p-4"><AdminEmptyState title="صف تولید خالی است." /></div>
            ) : (
              activeProjects.map((project) => (
                <div key={project.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/admin/projects/${project.id}`} className="font-semibold text-foreground hover:underline">
                        {project.title || "پروژه بدون عنوان"}
                      </Link>
                      <p className="truncate text-xs text-muted">{getUserDisplayName(project.user)} · {formatAdminDate(project.updatedAt)}</p>
                    </div>
                    <AdminStatus status={project.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="تیکت‌های باز" description="آخرین درخواست‌های پشتیبانی.">
          <div className="divide-y divide-border/60">
            {openTickets.length === 0 ? (
              <div className="p-4"><AdminEmptyState title="تیکت باز وجود ندارد." /></div>
            ) : (
              openTickets.map((ticket) => (
                <Link key={ticket.id} href={`/admin/support?ticketId=${ticket.id}`} className="block px-4 py-3 hover:bg-surface-soft/45">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{ticket.subject}</p>
                      <p className="truncate text-xs text-muted">{getUserDisplayName(ticket.user)} · {formatAdminDate(ticket.updatedAt)}</p>
                    </div>
                    <AdminStatus status={ticket.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="کاربران کم‌اعتبار" description="نشانه‌های friction قبل از خرید یا تولید.">
          <div className="divide-y divide-border/60">
            {lowCreditUsers.length === 0 ? (
              <div className="p-4"><AdminEmptyState title="کاربر کم‌اعتبار فوری نداریم." /></div>
            ) : (
              lowCreditUsers.map((user) => (
                <Link key={user.id} href={`/admin/users/${user.id}`} className="block px-4 py-3 hover:bg-surface-soft/45">
                  <p className="truncate font-semibold text-foreground">{getUserDisplayName(user)}</p>
                  <p className="truncate text-xs text-muted" dir="ltr">{getUserIdentifier(user)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {user.credits.toLocaleString("fa-IR")} اعتبار · {user._count.projects.toLocaleString("fa-IR")} پروژه · {user._count.assets.toLocaleString("fa-IR")} دارایی
                  </p>
                </Link>
              ))
            )}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="عملیات اخیر ادمین" description="آخرین تغییرات حساس ثبت‌شده در سیستم.">
        <AdminDataTable headers={["عملیات", "هدف", "ادمین", "زمان"]} empty={<AdminEmptyState title="هنوز رویداد audit ثبت نشده است." />}>
          {recentAuditEvents.map((event) => (
            <tr key={event.id}>
              <td className={adminTableCellClass}>
                <p className="font-semibold text-foreground" dir="ltr">{event.action}</p>
                <p className="text-xs text-muted">{event.summary}</p>
              </td>
              <td className={adminTableCellClass} dir="ltr">{event.targetType}/{event.targetId}</td>
              <td className={adminTableCellClass}>{event.actorAdmin ? getUserDisplayName(event.actorAdmin) : "سیستم"}</td>
              <td className={adminTableCellClass}>{formatAdminDate(event.createdAt)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>
    </>
  );
}

const adminSecondaryLinkClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:border-border-strong hover:bg-surface-soft";
