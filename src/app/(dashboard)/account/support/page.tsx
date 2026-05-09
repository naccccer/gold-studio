import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupportTicketAction, replySupportTicketAction } from "@/features/account/actions";
import { AccountSubpage, accountCardClass, accountInputClass, accountTextareaClass } from "@/features/account/components/account-subpage";
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
    <AccountSubpage title="پشتیبانی" caption="درخواست پشتیبانی ثبت کنید یا از راه تماس سریع با تیم هماهنگ شوید.">
      {settings?.isActive ? (
        <section className={`${accountCardClass} space-y-2`}>
          <div className="flex items-center gap-2">
            <Phone aria-hidden={true} className="h-4 w-4 text-[#8b6835]" />
            <h2 className="text-sm font-semibold text-foreground">تماس سریع</h2>
          </div>
          {settings.instructions ? <p className="text-xs leading-6 text-muted">{settings.instructions}</p> : null}
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
            {settings.phone ? <a href={`tel:${settings.phone}`} className="rounded-[0.9rem] bg-white/62 px-2 py-2 text-center text-foreground">تماس</a> : null}
            {settings.whatsappUrl ? <a href={settings.whatsappUrl} className="rounded-[0.9rem] bg-white/62 px-2 py-2 text-center text-foreground">واتساپ</a> : null}
            {settings.telegramUrl ? <a href={settings.telegramUrl} className="rounded-[0.9rem] bg-white/62 px-2 py-2 text-center text-foreground">تلگرام</a> : null}
          </div>
        </section>
      ) : null}

      <form action={createSupportTicketAction} className={`${accountCardClass} space-y-3`}>
        <h2 className="text-sm font-semibold text-foreground">تیکت جدید</h2>
        <input name="subject" placeholder="موضوع" className={accountInputClass} />
        <textarea name="body" placeholder="متن درخواست" className={accountTextareaClass} />
        <Button type="submit" size="full" className="h-11 rounded-[0.95rem]">
          <MessageCircle aria-hidden={true} className="h-4 w-4" />
          ثبت تیکت
        </Button>
      </form>

      <section className={`${accountCardClass} space-y-2`}>
        <h2 className="text-sm font-semibold text-foreground">پیگیری تیکت‌ها</h2>
        {tickets.length === 0 ? (
          <p className="text-xs leading-6 text-muted">هنوز تیکتی ثبت نشده است.</p>
        ) : (
          tickets.map((ticket) => (
            <a
              key={ticket.id}
              href={`/account/support?ticketId=${ticket.id}`}
              className={`block rounded-[0.9rem] px-3 py-2 ${selectedTicket?.id === ticket.id ? "bg-[#efe2cd]" : "bg-white/62"}`}
            >
              <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
              <p className="text-[11px] text-muted">{statusLabel[ticket.status] ?? ticket.status}</p>
            </a>
          ))
        )}
      </section>

      {selectedTicket ? (
        <section className={`${accountCardClass} space-y-2`}>
          <h2 className="text-sm font-semibold text-foreground">{selectedTicket.subject}</h2>
          {selectedTicket.messages.map((message) => (
            <div key={message.id} className={`rounded-[0.9rem] px-3 py-2 ${message.authorType === "ADMIN" ? "bg-[#efe2cd]" : "bg-white/62"}`}>
              <p className="text-[10px] font-semibold text-muted">{message.authorType === "ADMIN" ? "پشتیبانی" : "شما"}</p>
              <p className="mt-1 text-xs leading-6 text-foreground">{message.body}</p>
            </div>
          ))}
          {selectedTicket.status !== "CLOSED" ? (
            <form action={replySupportTicketAction} className="space-y-2 pt-1">
              <input type="hidden" name="ticketId" value={selectedTicket.id} />
              <textarea name="body" placeholder="پاسخ یا توضیح تکمیلی" className={accountTextareaClass} />
              <Button type="submit" size="full" variant="secondary" className="h-11 rounded-[0.95rem]">
                ارسال پاسخ
              </Button>
            </form>
          ) : null}
        </section>
      ) : null}
    </AccountSubpage>
  );
}
