import Link from "next/link";
import { MessageQuestion, NotificationBing } from "vuesax-icons-react";
import {
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  EmptyState,
  faNum,
  formatAdminDate,
  StatusDot,
  Surface,
} from "@/features/admin/components/console";
import { AdminNotificationForm } from "@/features/admin/components/admin-notification-form";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const [users, notifications, pendingQualityReviews, unreadCount, totalCount] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, name: true, email: true, phone: true },
    }),
    db.userNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        createdByAdmin: { select: { name: true, email: true, phone: true } },
      },
    }),
    db.qualityReview.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        project: { select: { id: true, title: true } },
      },
    }),
    db.userNotification.count({ where: { readAt: null } }),
    db.userNotification.count(),
  ]);

  return (
    <>
      <ConsoleHeader
        title="پیام‌ها"
        meta={
          <>
            <span>{faNum(totalCount)} پیام</span>
            {unreadCount > 0 ? <span className="font-medium text-amber-700">{faNum(unreadCount)} خوانده‌نشده</span> : null}
          </>
        }
      />

      {pendingQualityReviews.length > 0 ? (
        <Surface>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <MessageQuestion className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-navy-950">درخواست‌های بررسی کیفیت</h2>
            </div>
            <Link href="/admin/quality-reviews" className="text-xs font-medium text-navy-700 hover:underline">
              مشاهده همه
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingQualityReviews.map((review) => (
              <Link
                key={review.id}
                href="/admin/quality-reviews"
                className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-navy-25"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-navy-950">
                    {review.project.title || "پروژه بدون عنوان"}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {getUserDisplayName(review.user)} · {formatAdminDate(review.createdAt)}
                  </span>
                </span>
                <StatusDot status={review.status} />
              </Link>
            ))}
          </div>
        </Surface>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
        <Surface className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <NotificationBing className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-navy-950">ارسال پیام دستی</h2>
          </div>
          <AdminNotificationForm
            users={users.map((user) => ({
              id: user.id,
              label: `${getUserDisplayName(user)} · ${getUserIdentifier(user)}`,
            }))}
          />
        </Surface>

        <Surface>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-navy-950">پیام‌های اخیر</h2>
          </div>
          <ConsoleTable head={["پیام", "کاربر", "وضعیت", "ارسال"]} empty={<EmptyState title="پیامی ثبت نشده است." />}>
            {notifications.map((notification) => (
              <tr key={notification.id}>
                <td className={cellClass}>
                  <p className="font-medium">{notification.title}</p>
                  <p className="max-w-md truncate text-xs text-slate-500">{notification.body}</p>
                  {notification.href ? (
                    <p className="text-xs text-slate-400" dir="ltr">
                      {notification.href}
                    </p>
                  ) : null}
                </td>
                <td className={cellClass}>
                  <Link href={`/admin/users/${notification.userId}`} className="font-medium hover:text-navy-700 hover:underline">
                    {getUserDisplayName(notification.user)}
                  </Link>
                  <p className="text-xs text-slate-400" dir="ltr">{getUserIdentifier(notification.user)}</p>
                </td>
                <td className={cellClass}>
                  <StatusDot status={notification.readAt ? "COMPLETED" : "PENDING"} label={notification.readAt ? "خوانده‌شده" : "خوانده‌نشده"} />
                </td>
                <td className={`${cellClass} text-xs text-slate-500`}>
                  <p>{formatAdminDate(notification.createdAt)}</p>
                  {notification.createdByAdmin ? (
                    <p>ادمین: {getUserDisplayName(notification.createdByAdmin)}</p>
                  ) : null}
                </td>
              </tr>
            ))}
          </ConsoleTable>
        </Surface>
      </div>
    </>
  );
}
