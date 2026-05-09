import Link from "next/link";
import { Check, RefreshCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminMetric, AdminRow, AdminSection, AdminStatus, EmptyAdminState, formatAdminDate, formatIrr } from "@/features/admin/components/admin-ui";
import {
  adjustUserCreditsAction,
  approvePurchaseRequestAction,
  assignSubscriptionAction,
  rejectPurchaseRequestAction,
  resetSubscriptionPeriodAction,
  updateSubscriptionStatusAction,
  updateUserRoleAction,
} from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams?: Promise<{ q?: string; userId?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim();
  const selectedUserId = params?.userId?.trim();
  const where = q
    ? {
        OR: [
          { id: { contains: q } },
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      }
    : {};

  const [users, subscriptionPackages, selectedUser, pendingRequestsCount] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        _count: { select: { projects: true, assets: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { currentPeriodEnd: "desc" },
          take: 1,
          include: { package: true },
        },
      },
    }),
    db.billingPackage.findMany({
      where: { type: "SUBSCRIPTION", archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    selectedUserId
      ? db.user.findUnique({
          where: { id: selectedUserId },
          include: {
            projects: { orderBy: { createdAt: "desc" }, take: 8, include: { style: { select: { name: true } } } },
            assets: { orderBy: { createdAt: "desc" }, take: 8 },
            subscriptions: { orderBy: { createdAt: "desc" }, take: 8, include: { package: true } },
            purchaseRequests: { orderBy: { createdAt: "desc" }, take: 8, include: { package: true } },
            creditEvents: { orderBy: { createdAt: "desc" }, take: 10, include: { package: true } },
            _count: { select: { projects: true, assets: true } },
          },
        })
      : null,
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <AdminMetric label="کاربران نمایش‌داده‌شده" value={users.length} />
        <AdminMetric label="درخواست خرید باز" value={pendingRequestsCount} />
        <AdminMetric label="بسته اشتراک" value={subscriptionPackages.length} />
      </section>

      <AdminSection title="جست‌وجوی کاربران" eyebrow="نقش، اعتبار، اشتراک">
        <form className="mb-4 flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="نام، ایمیل، موبایل یا شناسه"
            className="h-10 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none"
          />
          <Button type="submit" size="sm">جست‌وجو</Button>
        </form>
        {users.map((user) => {
          const activeSubscription = user.subscriptions[0];
          return (
            <AdminRow key={user.id}>
              <div className="min-w-0">
                <Link href={`/admin/users?userId=${user.id}`} className="font-semibold text-foreground hover:underline">
                  {getUserDisplayName(user)}
                </Link>
                <p className="truncate text-xs text-muted" dir="ltr">{getUserIdentifier(user)}</p>
              </div>
              <div className="text-xs text-muted">
                <p>{user.credits.toLocaleString("fa-IR")} اعتبار · {user._count.projects.toLocaleString("fa-IR")} پروژه · {user._count.assets.toLocaleString("fa-IR")} دارایی</p>
                <p>{activeSubscription ? `${activeSubscription.package.title} تا ${formatAdminDate(activeSubscription.currentPeriodEnd)}` : "بدون اشتراک فعال"}</p>
              </div>
              <AdminStatus status={user.role} />
            </AdminRow>
          );
        })}
      </AdminSection>

      {selectedUser ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <AdminSection title="پرونده کاربر" eyebrow={getUserIdentifier(selectedUser)}>
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminMetric label="اعتبار خریداری‌شده" value={selectedUser.credits} />
              <AdminMetric label="پروژه" value={selectedUser._count.projects} />
              <AdminMetric label="دارایی" value={selectedUser._count.assets} />
            </div>

            <form action={adjustUserCreditsAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input type="hidden" name="userId" value={selectedUser.id} />
              <input name="delta" type="number" placeholder="+10 یا -2" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
              <input name="reason" placeholder="دلیل تغییر اعتبار" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
              <Button type="submit" size="sm">
                <Save className="h-4 w-4" />
                ثبت اعتبار
              </Button>
            </form>

            <form action={updateUserRoleAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <input type="hidden" name="userId" value={selectedUser.id} />
              <select name="role" defaultValue={selectedUser.role} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none">
                <option value="USER">کاربر</option>
                <option value="ADMIN">ادمین</option>
              </select>
              <input name="confirmRoleChange" placeholder="برای تایید بنویسید: تایید" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
              <span className="self-center text-xs text-muted">تغییر نقش حساس است.</span>
              <Button type="submit" size="sm">تغییر نقش</Button>
            </form>

            <form action={assignSubscriptionAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input type="hidden" name="userId" value={selectedUser.id} />
              <select name="packageId" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none">
                {subscriptionPackages.map((billingPackage) => (
                  <option key={billingPackage.id} value={billingPackage.id}>{billingPackage.title}</option>
                ))}
              </select>
              <input name="notes" placeholder="یادداشت اختصاص اشتراک" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
              <Button type="submit" size="sm">اختصاص اشتراک</Button>
            </form>
          </AdminSection>

          <AdminSection title="درخواست‌های خرید" eyebrow="تایید یا رد">
            {selectedUser.purchaseRequests.length === 0 ? (
              <EmptyAdminState>درخواستی برای این کاربر ثبت نشده است.</EmptyAdminState>
            ) : (
              selectedUser.purchaseRequests.map((request) => (
                <AdminRow key={request.id}>
                  <div>
                    <p className="font-semibold text-foreground">{request.package.title}</p>
                    <p className="text-xs text-muted">{formatIrr(request.amount, request.currency)} · {formatAdminDate(request.createdAt)}</p>
                  </div>
                  <AdminStatus status={request.status} />
                  {request.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <form action={approvePurchaseRequestAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <button className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-foreground px-3 text-xs text-surface">
                          <Check className="h-3.5 w-3.5" />
                          تایید
                        </button>
                      </form>
                      <form action={rejectPurchaseRequestAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <button className="h-9 rounded-[var(--radius-sm)] border border-danger/30 bg-danger-soft px-3 text-xs text-danger">رد</button>
                      </form>
                    </div>
                  ) : null}
                </AdminRow>
              ))
            )}
          </AdminSection>

          <AdminSection title="اشتراک‌ها" eyebrow="مدیریت دوره">
            {selectedUser.subscriptions.length === 0 ? (
              <EmptyAdminState>اشتراکی ثبت نشده است.</EmptyAdminState>
            ) : (
              selectedUser.subscriptions.map((subscription) => (
                <AdminRow key={subscription.id}>
                  <div>
                    <p className="font-semibold text-foreground">{subscription.package.title}</p>
                    <p className="text-xs text-muted">
                      {subscription.creditsUsedThisPeriod.toLocaleString("fa-IR")} از {subscription.creditsPerPeriod.toLocaleString("fa-IR")} مصرف شده · پایان {formatAdminDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                  <AdminStatus status={subscription.status} />
                  <div className="flex flex-wrap gap-2">
                    <form action={updateSubscriptionStatusAction}>
                      <input type="hidden" name="subscriptionId" value={subscription.id} />
                      <select name="status" defaultValue={subscription.status} className="h-9 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs">
                        <option value="ACTIVE">فعال</option>
                        <option value="PAUSED">متوقف</option>
                        <option value="CANCELED">لغوشده</option>
                        <option value="EXPIRED">منقضی</option>
                      </select>
                      <button className="mr-2 h-9 rounded-[var(--radius-sm)] bg-foreground px-3 text-xs text-surface">ثبت</button>
                    </form>
                    <form action={resetSubscriptionPeriodAction}>
                      <input type="hidden" name="subscriptionId" value={subscription.id} />
                      <button className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs">
                        <RefreshCcw className="h-3.5 w-3.5" />
                        تمدید دوره
                      </button>
                    </form>
                  </div>
                </AdminRow>
              ))
            )}
          </AdminSection>

          <AdminSection title="دفتر اعتبار" eyebrow="آخرین رویدادها">
            {selectedUser.creditEvents.length === 0 ? (
              <EmptyAdminState>هنوز رویداد اعتباری ثبت نشده است.</EmptyAdminState>
            ) : (
              selectedUser.creditEvents.map((event) => (
                <AdminRow key={event.id}>
                  <p className="font-semibold text-foreground">{event.delta.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-muted">{event.reason}</p>
                  <p className="text-xs text-muted">{formatAdminDate(event.createdAt)}</p>
                </AdminRow>
              ))
            )}
          </AdminSection>
        </div>
      ) : null}
    </>
  );
}
