import Link from "next/link";
import { Call, Save2 } from "vuesax-icons-react";
import {
  btnPrimary,
  btnSecondary,
  checkboxClass,
  ConsoleHeader,
  Disclosure,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  inlineFieldClass,
  formatAdminDate,
  SegmentedLinks,
  StatusDot,
  Surface,
  textareaClass,
} from "@/features/admin/components/console";
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

  const [settings, tickets, selectedTicket, openCount, answeredCount, closedCount] = await Promise.all([
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
  ]);

  const statusHref = (value: string) => {
    const query = new URLSearchParams();
    if (value) query.set("status", value);
    if (selectedTicketId) query.set("ticketId", selectedTicketId);
    const queryString = query.toString();
    return `/admin/support${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <>
      <ConsoleHeader
        title="پشتیبانی"
        meta={
          openCount > 0 ? (
            <span className="font-medium text-amber-700">{faNum(openCount)} تیکت باز</span>
          ) : (
            <span>بدون تیکت باز</span>
          )
        }
        actions={
          <Link href="/admin/support/faq" className={btnSecondary}>
            مدیریت پرسش‌های پرتکرار
          </Link>
        }
      />

      <SegmentedLinks
        items={[
          { href: statusHref(""), label: "همه", active: !status },
          { href: statusHref("OPEN"), label: "باز", active: status === "OPEN", count: openCount },
          { href: statusHref("ANSWERED"), label: "پاسخ داده‌شده", active: status === "ANSWERED", count: answeredCount },
          { href: statusHref("CLOSED"), label: "بسته", active: status === "CLOSED", count: closedCount },
        ]}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
        <Surface>
          <div className="max-h-[65vh] divide-y divide-slate-100 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-5">
                <EmptyState title="تیکتی با این فیلتر نیست." />
              </div>
            ) : (
              tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/support?ticketId=${ticket.id}${status ? `&status=${status}` : ""}`}
                  aria-current={selectedTicketId === ticket.id ? "true" : undefined}
                  className={`block px-4 py-3 transition ${selectedTicketId === ticket.id ? "bg-navy-50" : "hover:bg-navy-25"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-navy-950">{ticket.subject}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {getUserDisplayName(ticket.user)} · {formatAdminDate(ticket.updatedAt)}
                      </span>
                    </span>
                    <StatusDot status={ticket.status} className="shrink-0" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Surface>

        <div className="min-w-0 space-y-4">
          {!selectedTicket ? (
            <Surface className="p-8">
              <EmptyState title="یک تیکت از فهرست انتخاب کنید." />
            </Surface>
          ) : (
            <Surface key={selectedTicket.id}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-navy-950">{selectedTicket.subject}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <Link href={`/admin/users/${selectedTicket.userId}`} className="font-medium text-navy-700 hover:underline">
                      {getUserDisplayName(selectedTicket.user)}
                    </Link>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span dir="ltr">{getUserIdentifier(selectedTicket.user)}</span>
                  </p>
                </div>
                <form action={updateSupportTicketStatusAction} className="flex shrink-0 items-center gap-1.5">
                  <input type="hidden" name="ticketId" value={selectedTicket.id} />
                  <select name="status" defaultValue={selectedTicket.status} className={`${inlineFieldClass} w-32`}>
                    <option value="OPEN">باز</option>
                    <option value="ANSWERED">پاسخ داده‌شده</option>
                    <option value="CLOSED">بسته</option>
                  </select>
                  <button className={`${btnSecondary} h-8`}>ثبت</button>
                </form>
              </div>

              <div className="grid gap-2.5 p-5">
                {selectedTicket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={[
                      "max-w-xl rounded-xl px-4 py-2.5 text-sm leading-7",
                      message.authorType === "ADMIN" ? "justify-self-start bg-navy-900 text-white" : "justify-self-end bg-navy-25 text-navy-950",
                    ].join(" ")}
                  >
                    <p>{message.body}</p>
                    <p className={`mt-1 text-[11px] ${message.authorType === "ADMIN" ? "text-navy-200" : "text-slate-400"}`}>
                      {message.authorType === "ADMIN" ? "ادمین" : "کاربر"} · {formatAdminDate(message.createdAt)}
                    </p>
                  </div>
                ))}
              </div>

              <form action={replySupportTicketAction} className="grid gap-2 border-t border-slate-100 p-5">
                <input type="hidden" name="ticketId" value={selectedTicket.id} />
                <textarea name="body" required placeholder="پاسخ خود را بنویسید…" className={textareaClass} />
                <div>
                  <button className={btnPrimary}>ارسال پاسخ</button>
                </div>
              </form>
            </Surface>
          )}

          <Disclosure
            summary={
              <>
                <Call className="h-4 w-4 text-slate-400" />
                تنظیمات تماس سریع
              </>
            }
          >
            <form action={updateSupportSettingsAction} className="grid max-w-xl gap-3">
              <Field label="شماره تماس">
                <input name="phone" defaultValue={settings?.phone ?? ""} className={fieldClass} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="لینک واتساپ">
                  <input name="whatsappUrl" defaultValue={settings?.whatsappUrl ?? ""} dir="ltr" className={`${fieldClass} text-left`} />
                </Field>
                <Field label="لینک تلگرام">
                  <input name="telegramUrl" defaultValue={settings?.telegramUrl ?? ""} dir="ltr" className={`${fieldClass} text-left`} />
                </Field>
              </div>
              <Field label="توضیح راهنمای پشتیبانی">
                <textarea name="instructions" defaultValue={settings?.instructions ?? ""} className={textareaClass} />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-navy-900">
                  <input name="isActive" type="checkbox" defaultChecked={settings?.isActive ?? true} className={checkboxClass} />
                  نمایش در حساب کاربر
                </label>
                <button className={btnPrimary}>
                  <Save2 className="h-4 w-4" />
                  ذخیره تنظیمات
                </button>
              </div>
            </form>
          </Disclosure>
        </div>
      </div>
    </>
  );
}
