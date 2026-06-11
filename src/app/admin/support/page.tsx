import Link from "next/link";
import {
  adminInputClass,
  adminPrimaryActionClass,
  adminSecondaryActionClass,
  adminTextareaClass,
  AdminEmptyState,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import {
  replySupportTicketAction,
  updateSupportSettingsAction,
  updateSupportTicketStatusAction,
} from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminSupportPageProps = {
  searchParams?: Promise<{ ticketId?: string; status?: string }>;
};

export default async function AdminSupportPage({ searchParams }: AdminSupportPageProps) {
  const params = await searchParams;
  const selectedTicketId = params?.ticketId;
  const status = params?.status ?? "";

  const [settings, tickets, selectedTicket, openCount, answeredCount, closedCount, faqCount] = await Promise.all([
    db.supportSettings.findUnique({ where: { id: "default" } }),
    db.supportTicket.findMany({
      where: status && status !== "ALL" ? { status: status as "OPEN" | "ANSWERED" | "CLOSED" } : {},
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    selectedTicketId
      ? db.supportTicket.findUnique({
          where: { id: selectedTicketId },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            messages: { orderBy: { createdAt: "asc" } },
          },
        })
      : null,
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.supportTicket.count({ where: { status: "ANSWERED" } }),
    db.supportTicket.count({ where: { status: "CLOSED" } }),
    db.faqItem.count(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="پشتیبانی"
        description="Inbox عملیاتی برای تیکت‌ها، پاسخ‌ها و وضعیت تماس سریع."
        actions={<Link href="/admin/support/faq" className={adminPrimaryActionClass}>مدیریت FAQ</Link>}
      />

      <AdminKpiStrip>
        <AdminKpi label="باز" value={openCount} tone={openCount ? "attention" : "neutral"} />
        <AdminKpi label="پاسخ داده‌شده" value={answeredCount} />
        <AdminKpi label="بسته" value={closedCount} />
        <AdminKpi label="FAQ" value={faqCount} />
      </AdminKpiStrip>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <AdminPanel title="تنظیمات تماس سریع" description="در حساب کاربر نمایش داده می‌شود.">
            <form action={updateSupportSettingsAction} className="grid gap-3 p-4">
              <input name="phone" defaultValue={settings?.phone ?? ""} placeholder="شماره تماس" className={adminInputClass} />
              <input name="whatsappUrl" defaultValue={settings?.whatsappUrl ?? ""} placeholder="لینک واتساپ" dir="ltr" className={`${adminInputClass} text-left`} />
              <input name="telegramUrl" defaultValue={settings?.telegramUrl ?? ""} placeholder="لینک تلگرام" dir="ltr" className={`${adminInputClass} text-left`} />
              <textarea name="instructions" defaultValue={settings?.instructions ?? ""} placeholder="توضیح راهنمای پشتیبانی" className={adminTextareaClass} />
              <label className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-950">
                <input name="isActive" type="checkbox" defaultChecked={settings?.isActive ?? true} className="h-4 w-4 accent-slate-950" />
                فعال
              </label>
              <button className={adminPrimaryActionClass}>ذخیره تنظیمات</button>
            </form>
          </AdminPanel>

          <AdminPanel title="Inbox تیکت‌ها">
            <div className="border-b border-slate-200 p-3">
              <form className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select name="status" defaultValue={status} className={adminInputClass}>
                  <option value="">همه وضعیت‌ها</option>
                  <option value="OPEN">باز</option>
                  <option value="ANSWERED">پاسخ داده‌شده</option>
                  <option value="CLOSED">بسته</option>
                </select>
                <button className={adminSecondaryActionClass}>فیلتر</button>
              </form>
            </div>
            <div className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <div className="p-4"><AdminEmptyState title="تیکتی با این فیلتر نیست." /></div>
              ) : (
                tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/support?ticketId=${ticket.id}${status ? `&status=${status}` : ""}`}
                    className={[
                      "block px-4 py-3 hover:bg-slate-50",
                      selectedTicketId === ticket.id ? "bg-cyan-50" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{ticket.subject}</p>
                        <p className="truncate text-xs text-slate-500">{getUserDisplayName(ticket.user)} · {formatAdminDate(ticket.updatedAt)}</p>
                        <p className="mt-1 max-w-sm truncate text-xs text-slate-600">{ticket.messages[0]?.body || "بدون پیام"}</p>
                      </div>
                      <AdminStatus status={ticket.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </AdminPanel>
        </div>

        <AdminPanel title="پرونده تیکت" description={selectedTicket ? selectedTicket.subject : "یک تیکت از Inbox انتخاب کنید."}>
          {!selectedTicket ? (
            <div className="p-4"><AdminEmptyState title="تیکتی انتخاب نشده است." /></div>
          ) : (
            <div className="grid gap-4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-950">{selectedTicket.subject}</p>
                  <Link href={`/admin/users/${selectedTicket.userId}`} className="text-xs font-semibold text-slate-700 hover:underline">
                    {getUserDisplayName(selectedTicket.user)}
                  </Link>
                  <p className="text-xs text-slate-500" dir="ltr">{getUserIdentifier(selectedTicket.user)}</p>
                </div>
                <AdminStatus status={selectedTicket.status} />
              </div>

              <div className="grid gap-2">
                {selectedTicket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm leading-7",
                      message.authorType === "ADMIN" ? "border-slate-200 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800",
                    ].join(" ")}
                  >
                    <p>{message.body}</p>
                    <p className={message.authorType === "ADMIN" ? "mt-1 text-[11px] text-slate-400" : "mt-1 text-[11px] text-slate-500"}>
                      {message.authorType === "ADMIN" ? "ادمین" : "کاربر"} · {formatAdminDate(message.createdAt)}
                    </p>
                  </div>
                ))}
              </div>

              <form action={replySupportTicketAction} className="grid gap-2">
                <input type="hidden" name="ticketId" value={selectedTicket.id} />
                <textarea name="body" placeholder="پاسخ ادمین" className={adminTextareaClass} />
                <button className={adminPrimaryActionClass}>ارسال پاسخ</button>
              </form>

              <form action={updateSupportTicketStatusAction} className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                <input type="hidden" name="ticketId" value={selectedTicket.id} />
                <select name="status" defaultValue={selectedTicket.status} className={adminInputClass}>
                  <option value="OPEN">باز</option>
                  <option value="ANSWERED">پاسخ داده‌شده</option>
                  <option value="CLOSED">بسته</option>
                </select>
                <button className={adminSecondaryActionClass}>ثبت وضعیت</button>
              </form>
            </div>
          )}
        </AdminPanel>
      </div>
    </>
  );
}
