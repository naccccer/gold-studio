import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageQuestion, ReceiptText, Refresh } from "vuesax-icons-react";
import {
  btnDanger,
  btnPrimary,
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  EmptyState,
  formatAdminDate,
  formatIrr,
  StatBar,
  StatusDot,
  Surface,
} from "@/features/admin/components/console";
import { approvePurchaseRequestAction, rejectPurchaseRequestAction, retryAdminProjectAction } from "@/features/admin/actions";
import { requireAdminOrSalesSession } from "@/lib/auth/session";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";
import { getVerticalLabel } from "@/lib/verticals";

export const dynamic = "force-dynamic";

function VerticalBadge({ vertical }: { vertical: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700">
      {getVerticalLabel(vertical)}
    </span>
  );
}

export default async function AdminPage() {
  const session = await requireAdminOrSalesSession();
  if (session.role === "SALES") {
    redirect("/admin/billing");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    pendingPurchaseCount,
    openTicketCount,
    activeGenerationCount,
    failedGenerationCount,
    providerFailureTodayCount,
    pendingQualityReviewCount,
    pendingPurchases,
    failedProjects,
    openTickets,
    pendingQualityReviews,
  ] = await Promise.all([
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
    db.supportTicket.count({ where: { status: { not: "CLOSED" } } }),
    db.project.count({ where: { status: { in: ["QUEUED", "PROCESSING"] }, archivedAt: null } }),
    db.project.count({ where: { status: "FAILED", archivedAt: null } }),
    db.providerEvent.count({ where: { status: "FAILED", createdAt: { gte: today } } }),
    db.qualityReview.count({ where: { status: "PENDING" } }),
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
    db.supportTicket.findMany({
      where: { status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { user: { select: { name: true, email: true, phone: true } } },
    }),
    db.qualityReview.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        project: { select: { id: true, title: true } },
      },
    }),
  ]);

  const allClear =
    pendingPurchaseCount === 0 && failedGenerationCount === 0 && openTicketCount === 0 && pendingQualityReviewCount === 0;

  return (
    <>
      <ConsoleHeader
        title="نمای کلی"
        meta={
          allClear ? (
            <span className="font-medium text-emerald-700">بدون مورد فوری</span>
          ) : (
            <span>نیازمند اقدام</span>
          )
        }
      />

      <StatBar
        items={[
          { label: "رسید در انتظار", value: pendingPurchaseCount, tone: pendingPurchaseCount ? "attention" : "neutral", href: "/admin/billing" },
          { label: "بررسی کیفیت", value: pendingQualityReviewCount, tone: pendingQualityReviewCount ? "attention" : "neutral", href: "/admin/quality-reviews" },
          { label: "شکست تولید", value: failedGenerationCount, tone: failedGenerationCount ? "danger" : "neutral", href: "/admin/projects?status=FAILED" },
          { label: "تیکت باز", value: openTicketCount, tone: openTicketCount ? "attention" : "neutral", href: "/admin/support" },
          { label: "در صف تولید", value: activeGenerationCount, href: "/admin/projects" },
          { label: "خطای Provider امروز", value: providerFailureTodayCount, tone: providerFailureTodayCount ? "danger" : "neutral", href: "/admin/ai" },
        ]}
      />

      <Surface>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy-950">رسیدهای منتظر تایید</h2>
          <Link href="/admin/billing" className="text-xs font-medium text-navy-700 hover:underline">
            همه پرداخت‌ها
          </Link>
        </div>
        <ConsoleTable head={["بسته", "ورتیکال", "کاربر", "مبلغ", "رسید", ""]} empty={<EmptyState title="رسید منتظر تایید نداریم." />}>
          {pendingPurchases.map((request) => {
            const receiptUrl = storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl);
            return (
              <tr key={request.id}>
                <td className={cellClass}>
                  <p className="font-medium">{request.package.title}</p>
                  <p className="text-xs text-slate-400">{formatAdminDate(request.createdAt)}</p>
                </td>
                <td className={cellClass}>
                  <VerticalBadge vertical={request.vertical} />
                  {request.package.vertical !== request.vertical ? (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">عدم تطابق بسته</p>
                  ) : null}
                </td>
                <td className={cellClass}>
                  <Link href={`/admin/users/${request.userId}`} className="font-medium hover:text-navy-700 hover:underline">
                    {getUserDisplayName(request.user)}
                  </Link>
                  <p className="text-xs text-slate-400" dir="ltr">
                    {getUserIdentifier(request.user)}
                  </p>
                </td>
                <td className={`${cellClass} tabular-nums`}>{formatIrr(request.amount, request.currency)}</td>
                <td className={cellClass}>
                  {receiptUrl ? (
                    <a href={receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline">
                      <ReceiptText className="h-3.5 w-3.5" />
                      مشاهده
                    </a>
                  ) : (
                    <span className="text-xs text-rose-600">بدون رسید</span>
                  )}
                </td>
                <td className={cellClass}>
                  <div className="flex justify-end gap-1.5">
                    <form action={approvePurchaseRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button className={btnPrimary}>تایید</button>
                    </form>
                    <form action={rejectPurchaseRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button className={btnDanger}>رد</button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </ConsoleTable>
      </Surface>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Surface>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-950">
              <MessageQuestion className="h-4 w-4 text-amber-600" />
              بررسی‌های کیفیت
            </h2>
            <Link href="/admin/quality-reviews" className="text-xs font-medium text-navy-700 hover:underline">
              همه درخواست‌ها
            </Link>
          </div>
          {pendingQualityReviews.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState title="درخواست بررسی کیفیت باز نداریم." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingQualityReviews.map((review) => (
                <Link key={review.id} href="/admin/quality-reviews" className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-navy-25">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-navy-950">{review.project.title || "پروژه بدون عنوان"}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {getUserDisplayName(review.user)} · {formatAdminDate(review.createdAt)}
                    </span>
                  </span>
                  <StatusDot status={review.status} />
                </Link>
              ))}
            </div>
          )}
        </Surface>

        <Surface>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-navy-950">شکست‌های تولید</h2>
            <Link href="/admin/projects?status=FAILED" className="text-xs font-medium text-navy-700 hover:underline">
              همه شکست‌ها
            </Link>
          </div>
          {failedProjects.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState title="پروژه ناموفق فعالی وجود ندارد." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {failedProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/projects/${project.id}`} className="block truncate text-sm font-medium text-navy-950 hover:text-navy-700 hover:underline">
                      {project.title || "پروژه بدون عنوان"}
                    </Link>
                    <p className="truncate text-xs text-slate-400">
                      {getUserDisplayName(project.user)} · {project.style.name}
                    </p>
                    <p className="truncate text-xs text-rose-600">{project.errorMessage || "خطای ثبت‌شده ندارد"}</p>
                  </div>
                  <form action={retryAdminProjectAction} className="shrink-0">
                    <input type="hidden" name="projectId" value={project.id} />
                    <button className={btnPrimary}>
                      <Refresh className="h-3.5 w-3.5" />
                      تلاش دوباره
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </Surface>

        <Surface>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-navy-950">تیکت‌های باز</h2>
            <Link href="/admin/support" className="text-xs font-medium text-navy-700 hover:underline">
              صندوق پشتیبانی
            </Link>
          </div>
          {openTickets.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState title="تیکت بازی وجود ندارد." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {openTickets.map((ticket) => (
                <Link key={ticket.id} href={`/admin/support?ticketId=${ticket.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-navy-25">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-navy-950">{ticket.subject}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {getUserDisplayName(ticket.user)} · {formatAdminDate(ticket.updatedAt)}
                    </span>
                  </span>
                  <StatusDot status={ticket.status} />
                </Link>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </>
  );
}
