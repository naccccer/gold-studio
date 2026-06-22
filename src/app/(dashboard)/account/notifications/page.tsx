import Link from "next/link";
import { ArrowLeft2, NotificationBing, TickCircle } from "vuesax-icons-react";
import { markAllNotificationsReadAction } from "@/features/account/actions";
import { AccountSectionHeader, AccountSubpage, accountCardClass } from "@/features/account/components/account-subpage";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatNotificationDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function NotificationsPage() {
  const session = await requireUserSession();
  const notifications = await db.userNotification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <AccountSubpage title="پیام‌ها">
      <section className={`${accountCardClass} space-y-3`}>
        <div className="flex items-start justify-between gap-3">
          <AccountSectionHeader
            icon={NotificationBing}
            title="پیام‌ها"
            caption="نتیجه بررسی‌ها، پیام‌های ادمین و اطلاعیه‌های مهم اینجا می‌آیند."
          />
          {unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent-wash px-3 text-[11px] font-semibold text-accent-deep">
                <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                خواندن همه
              </button>
            </form>
          ) : null}
        </div>
      </section>

      {notifications.length === 0 ? (
        <section className={`${accountCardClass} py-8 text-center`}>
          <p className="text-sm font-semibold text-foreground">هنوز پیامی ندارید.</p>
        </section>
      ) : (
        <section className="space-y-2.5">
          {notifications.map((notification) => {
            const unread = !notification.readAt;
            const body = (
              <article
                className={[
                  "motion-surface grid min-h-[5.25rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[1.05rem] border px-3.5 py-3 text-right",
                  unread
                    ? "border-accent-soft bg-surface shadow-[0_18px_42px_-42px_rgba(17,16,14,0.72)]"
                    : "border-white/72 bg-surface/64",
                ].join(" ")}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {unread ? <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-danger-bright" /> : null}
                    <h2 className="truncate text-sm font-semibold text-foreground">{notification.title}</h2>
                  </div>
                  <p className="mt-1 text-xs leading-6 text-muted">{notification.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatNotificationDate(notification.createdAt)}</p>
                </div>
                {notification.href ? <ArrowLeft2 aria-hidden={true} className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
              </article>
            );

            return notification.href ? (
              <Link key={notification.id} href={notification.href} className="block focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]">
                {body}
              </Link>
            ) : (
              <div key={notification.id}>{body}</div>
            );
          })}
        </section>
      )}
    </AccountSubpage>
  );
}
