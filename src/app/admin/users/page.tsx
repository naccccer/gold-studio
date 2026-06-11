import Link from "next/link";
import { Add, SearchNormal1 } from "vuesax-icons-react";
import type { Prisma } from "@/generated/prisma";
import {
  adminInputClass,
  adminPrimaryActionClass,
  adminSecondaryActionClass,
  adminTableCellClass,
  AdminDataTable,
  AdminEmptyState,
  AdminFilterBar,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import { createAdminUserAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams?: Promise<{ q?: string; role?: string; credit?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim();
  const role = params?.role;
  const credit = params?.credit;

  const where: Prisma.UserWhereInput = {
    ...(role === "ADMIN" || role === "USER" ? { role: role as "ADMIN" | "USER" } : {}),
    ...(credit === "low" ? { credits: { lte: 1 } } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { referralCode: { contains: q } },
          ],
        }
      : {}),
  };

  const [users, totalUsers, adminUsers, lowCreditUsers, activeSubscriptions] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: { select: { projects: true, assets: true, purchaseRequests: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { currentPeriodEnd: "desc" },
          take: 1,
          include: { package: true },
        },
      },
    }),
    db.user.count(),
    db.user.count({ where: { role: "ADMIN" } }),
    db.user.count({ where: { credits: { lte: 1 } } }),
    db.userSubscription.count({ where: { status: "ACTIVE", currentPeriodEnd: { gt: new Date() } } }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="کاربران"
        description="فهرست کاربران برای جست‌وجو و triage است؛ عملیات حساس داخل پرونده اختصاصی هر کاربر انجام می‌شود."
        actions={<a href="#create-user" className={adminPrimaryActionClass}><Add className="h-4 w-4" /> کاربر جدید</a>}
      />

      <AdminKpiStrip>
        <AdminKpi label="کل کاربران" value={totalUsers} />
        <AdminKpi label="ادمین‌ها" value={adminUsers} />
        <AdminKpi label="کم‌اعتبار" value={lowCreditUsers} tone={lowCreditUsers ? "attention" : "neutral"} />
        <AdminKpi label="اشتراک فعال" value={activeSubscriptions} />
        <AdminKpi label="نمایش فعلی" value={users.length} />
      </AdminKpiStrip>

      <AdminFilterBar>
        <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_150px_auto]">
          <input name="q" defaultValue={q} placeholder="نام، ایمیل، موبایل، شناسه یا کد معرف" className={adminInputClass} />
          <select name="role" defaultValue={role ?? ""} className={adminInputClass}>
            <option value="">همه نقش‌ها</option>
            <option value="USER">کاربر</option>
            <option value="ADMIN">ادمین</option>
          </select>
          <select name="credit" defaultValue={credit ?? ""} className={adminInputClass}>
            <option value="">همه اعتبارها</option>
            <option value="low">اعتبار کم</option>
          </select>
          <button className={adminPrimaryActionClass}>
            <SearchNormal1 className="h-4 w-4" />
            اعمال
          </button>
        </form>
      </AdminFilterBar>

      <AdminPanel title="فهرست کاربران" description={`${users.length.toLocaleString("fa-IR")} کاربر`}>
        <AdminDataTable headers={["کاربر", "نقش", "اعتبار", "اشتراک", "فعالیت", "آخرین تغییر"]} empty={<AdminEmptyState title="کاربری با این فیلتر پیدا نشد." />}>
          {users.map((user) => {
            const subscription = user.subscriptions[0];
            return (
              <tr key={user.id}>
                <td className={adminTableCellClass}>
                  <Link href={`/admin/users/${user.id}`} className="font-semibold text-foreground hover:underline">
                    {getUserDisplayName(user)}
                  </Link>
                  <p className="text-xs text-muted" dir="ltr">{getUserIdentifier(user)}</p>
                </td>
                <td className={adminTableCellClass}><AdminStatus status={user.role} /></td>
                <td className={adminTableCellClass}>
                  <p className="font-semibold text-foreground">{user.credits.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-muted">رزرو: {user.reservedCredits.toLocaleString("fa-IR")}</p>
                </td>
                <td className={adminTableCellClass}>
                  {subscription ? (
                    <>
                      <p className="font-semibold text-foreground">{subscription.package.title}</p>
                      <p className="text-xs text-muted">تا {formatAdminDate(subscription.currentPeriodEnd)}</p>
                    </>
                  ) : (
                    <span className="text-xs text-muted">بدون اشتراک فعال</span>
                  )}
                </td>
                <td className={adminTableCellClass}>
                  <p className="text-xs text-muted">
                    {user._count.projects.toLocaleString("fa-IR")} پروژه · {user._count.assets.toLocaleString("fa-IR")} دارایی · {user._count.purchaseRequests.toLocaleString("fa-IR")} خرید
                  </p>
                </td>
                <td className={adminTableCellClass}>{formatAdminDate(user.updatedAt)}</td>
              </tr>
            );
          })}
        </AdminDataTable>
      </AdminPanel>

      <AdminPanel id="create-user" title="ساخت کاربر جدید" description="برای عملیات داخلی یا ساخت دستی حساب فروشنده.">
        <form action={createAdminUserAction} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_160px_auto] md:items-end">
          <label className="grid gap-1.5 text-xs font-semibold text-muted">
            نام یا فروشگاه
            <input name="name" required minLength={2} maxLength={80} className={adminInputClass} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-muted">
            ایمیل
            <input name="email" type="email" dir="ltr" className={`${adminInputClass} text-left`} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-muted">
            موبایل
            <input name="phone" inputMode="tel" dir="ltr" className={`${adminInputClass} text-left`} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-muted">
            رمز عبور
            <input name="password" type="password" required minLength={6} dir="ltr" className={`${adminInputClass} text-left`} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-muted">
            نقش
            <select name="role" defaultValue="USER" className={adminInputClass}>
              <option value="USER">کاربر</option>
              <option value="ADMIN">ادمین</option>
            </select>
          </label>
          <button className={`${adminSecondaryActionClass} md:col-start-5`}>
            <Add className="h-4 w-4" />
            ساخت
          </button>
        </form>
      </AdminPanel>
    </>
  );
}
