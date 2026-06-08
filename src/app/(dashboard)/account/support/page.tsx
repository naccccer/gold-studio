import { LifeBuoy, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AccountSectionHeader,
  AccountSubpage,
  accountCardClass,
  accountInputClass,
  accountMutedCardClass,
  accountTextareaClass,
} from "@/features/account/components/account-subpage";
import { createSupportTicketAction, replySupportTicketAction } from "@/features/account/actions";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type SupportPageProps = {
  searchParams?: Promise<{ ticketId?: string }>;
};

const statusLabel: Record<string, string> = {
  OPEN: "باز",
  ANSWERED: "پاسخ داده‌شده",
  CLOSED: "بسته",
};

export default async function AccountSupportPage({ searchParams }: SupportPageProps) {
  const session = await requireUserSession();
  const params = await searchParams;
  const [settings, tickets] = await Promise.all([
    db.supportSettings.findUnique({ where: { id: "default" } }),
    db.supportTicket.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { messages: { orderBy: { createdAt: "asc" }, take: 8 } },
    }),
  ]);
  const selectedTicket = tickets.find((ticket) => ticket.id === params?.ticketId) ?? tickets[0] ?? null;

  return (
    <AccountSubpage title="پشتیبانی">
      {settings?.isActive ? (
        <section className={`${accountCardClass} space-y-3`}>
          <AccountSectionHeader icon={LifeBuoy} title="راه ارتباط سریع" />
          {settings.instructions ? <p className="text-xs leading-6 text-ink-3">{settings.instructions}</p> : null}
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
            {settings.phone ? <a href={`tel:${settings.phone}`} className="rounded-[var(--r-md)] border border-border bg-surface px-2 py-2.5 text-center text-ink-1">تماس</a> : null}
            {settings.whatsappUrl ? <a href={settings.whatsappUrl} className="rounded-[var(--r-md)] border border-border bg-surface px-2 py-2.5 text-center text-ink-1">واتساپ</a> : null}
            {settings.telegramUrl ? <a href={settings.telegramUrl} className="rounded-[var(--r-md)] border border-border bg-surface px-2 py-2.5 text-center text-ink-1">تلگرام</a> : null}
          </div>
        </section>
      ) : null}

      <form action={createSupportTicketAction} className={`${accountCardClass} space-y-3`}>
        <AccountSectionHeader icon={HelpCircle} title="تیکت جدید" />
        <input name="subject" placeholder="موضوع" className={accountInputClass} />
        <textarea name="body" placeholder="متن درخواست" className={accountTextareaClass} />
        <Button type="submit" size="full" className="h-11">
          ثبت تیکت
        </Button>
      </form>

      <section className={`${accountCardClass} space-y-2.5`}>
        <h2 className="text-sm font-semibold text-ink-1">پیگیری تیکت‌ها</h2>
        {tickets.length === 0 ? (
          <p className="text-xs leading-6 text-ink-3">موردی نیست.</p>
        ) : (
          tickets.map((ticket) => (
            <a
              key={ticket.id}
              href={`/account/support?ticketId=${ticket.id}`}
              className={`block rounded-[var(--r-md)] border border-border-hairline px-3 py-2.5 transition hover:border-border ${
                selectedTicket?.id === ticket.id ? "bg-champagne-50" : "bg-surface-soft/68"
              }`}
            >
              <p className="text-sm font-semibold text-ink-1">{ticket.subject}</p>
              <p className="mt-1 text-[11px] text-ink-3">{statusLabel[ticket.status] ?? ticket.status}</p>
            </a>
          ))
        )}
      </section>

      {selectedTicket ? (
        <section className={`${accountCardClass} space-y-3`}>
          <h2 className="text-sm font-semibold text-ink-1">{selectedTicket.subject}</h2>
          <p className="text-[11px] text-ink-3">{statusLabel[selectedTicket.status] ?? selectedTicket.status}</p>
          {selectedTicket.messages.map((message) => (
            <div
              key={message.id}
              className={
                message.authorType === "ADMIN"
                  ? "rounded-[var(--r-md)] border border-champagne-200 bg-champagne-50/72 px-3 py-2.5"
                  : accountMutedCardClass
              }
            >
              <p className="text-[10px] font-semibold text-ink-3">{message.authorType === "ADMIN" ? "پشتیبانی" : "شما"}</p>
              <p className="mt-1 text-xs leading-6 text-ink-1">{message.body}</p>
            </div>
          ))}
          {selectedTicket.status !== "CLOSED" ? (
            <form action={replySupportTicketAction} className="space-y-2 border-t border-border-hairline pt-3">
              <input type="hidden" name="ticketId" value={selectedTicket.id} />
              <textarea name="body" placeholder="پاسخ" className={accountTextareaClass} />
              <Button type="submit" size="full" variant="secondary" className="h-11">
                ارسال پاسخ
              </Button>
            </form>
          ) : null}
        </section>
      ) : null}
    </AccountSubpage>
  );
}
