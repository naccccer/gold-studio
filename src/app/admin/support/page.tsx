import {
  createFaqItemAction,
  replySupportTicketAction,
  updateFaqItemAction,
  updateSupportSettingsAction,
  updateSupportTicketStatusAction,
} from "@/features/admin/actions";
import { adminInputClass, adminTextareaClass, AdminMetric, AdminRow, AdminSection, AdminStatus, EmptyAdminState, formatAdminDate } from "@/features/admin/components/admin-ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const inputClass = adminInputClass;
const textareaClass = adminTextareaClass;

export default async function AdminSupportPage() {
  const [settings, tickets, faqs, openCount] = await Promise.all([
    db.supportSettings.findUnique({ where: { id: "default" } }),
    db.supportTicket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        messages: { orderBy: { createdAt: "asc" }, take: 6 },
      },
    }),
    db.faqItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    db.supportTicket.count({ where: { status: { not: "CLOSED" } } }),
  ]);

  return (
    <div className="space-y-4">
      <section className="grid gap-2.5 sm:grid-cols-3">
        <AdminMetric label="تیکت باز" value={openCount} />
        <AdminMetric label="FAQ" value={faqs.length} />
        <AdminMetric label="تیکت اخیر" value={tickets.length} />
      </section>

      <AdminSection title="تنظیمات تماس سریع" eyebrow="نمایش در حساب کاربر">
        <form action={updateSupportSettingsAction} className="grid gap-3 md:grid-cols-2">
          <input name="phone" defaultValue={settings?.phone ?? ""} placeholder="شماره تماس" className={inputClass} />
          <input name="whatsappUrl" defaultValue={settings?.whatsappUrl ?? ""} placeholder="لینک واتساپ" dir="ltr" className={`${inputClass} text-left`} />
          <input name="telegramUrl" defaultValue={settings?.telegramUrl ?? ""} placeholder="لینک تلگرام" dir="ltr" className={`${inputClass} text-left`} />
          <label className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs">
            <input name="isActive" type="checkbox" defaultChecked={settings?.isActive ?? true} className="h-4 w-4 accent-accent" />
            فعال
          </label>
          <textarea name="instructions" defaultValue={settings?.instructions ?? ""} placeholder="توضیح راهنمای پشتیبانی" className={`${textareaClass} md:col-span-2`} />
          <Button type="submit" size="sm" className="md:col-span-2">ذخیره تنظیمات</Button>
        </form>
      </AdminSection>

      <AdminSection title="تیکت‌ها" eyebrow="پاسخ و وضعیت">
        {tickets.length === 0 ? (
          <EmptyAdminState>تیکتی ثبت نشده است.</EmptyAdminState>
        ) : (
          tickets.map((ticket) => (
            <AdminRow key={ticket.id}>
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="font-semibold text-foreground">{ticket.subject}</p>
                  <p className="text-xs text-muted">
                    {ticket.user.name || ticket.user.email || ticket.user.phone || "کاربر"} · {formatAdminDate(ticket.createdAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  {ticket.messages.map((message) => (
                    <p key={message.id} className="rounded-[var(--radius-sm)] bg-surface-soft px-3 py-2 text-xs leading-6 text-muted">
                      {message.authorType === "ADMIN" ? "ادمین: " : "کاربر: "}
                      {message.body}
                    </p>
                  ))}
                </div>
                <form action={replySupportTicketAction} className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <input name="body" placeholder="پاسخ ادمین" className={inputClass} />
                  <Button type="submit" size="sm">ارسال پاسخ</Button>
                </form>
              </div>
              <div className="space-y-2">
                <AdminStatus status={ticket.status} />
                <form action={updateSupportTicketStatusAction} className="flex gap-2">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <select name="status" defaultValue={ticket.status} className={inputClass}>
                    <option value="OPEN">باز</option>
                    <option value="ANSWERED">پاسخ داده‌شده</option>
                    <option value="CLOSED">بسته</option>
                  </select>
                  <Button type="submit" size="sm">ثبت</Button>
                </form>
              </div>
            </AdminRow>
          ))
        )}
      </AdminSection>

      <AdminSection title="سوالات پرتکرار" eyebrow="نمایش در حساب کاربر">
        <form action={createFaqItemAction} className="mb-4 grid gap-2 md:grid-cols-[1fr_100px_auto]">
          <input name="question" placeholder="سوال" className={inputClass} />
          <input name="sortOrder" type="number" defaultValue={10} className={inputClass} />
          <label className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs">
            <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-accent" />
            فعال
          </label>
          <textarea name="answer" placeholder="پاسخ" className={`${textareaClass} md:col-span-3`} />
          <Button type="submit" size="sm" className="md:col-span-3">افزودن سوال</Button>
        </form>

        {faqs.length === 0 ? (
          <EmptyAdminState>FAQ ثبت نشده است.</EmptyAdminState>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <form key={faq.id} action={updateFaqItemAction} className="grid gap-2 rounded-[var(--radius-md)] border border-border bg-surface-soft/50 p-3 md:grid-cols-[1fr_100px_auto]">
                <input type="hidden" name="faqId" value={faq.id} />
                <input name="question" defaultValue={faq.question} className={inputClass} />
                <input name="sortOrder" type="number" defaultValue={faq.sortOrder} className={inputClass} />
                <label className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs">
                  <input name="isActive" type="checkbox" defaultChecked={faq.isActive} className="h-4 w-4 accent-accent" />
                  فعال
                </label>
                <textarea name="answer" defaultValue={faq.answer} className={`${textareaClass} md:col-span-3`} />
                <Button type="submit" size="sm" className="md:col-span-3">ذخیره FAQ</Button>
              </form>
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
