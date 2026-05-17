import Link from "next/link";
import type { ReactNode } from "react";
import { Add, Key, Refresh, Save2, SearchNormal1, ShieldTick, TickCircle, UserEdit, Wallet } from "vuesax-icons-react";
import { Button } from "@/components/ui/button";
import {
  adminDangerActionClass,
  adminInputClass,
  adminLabelClass,
  adminPrimaryActionClass,
  AdminMetric,
  AdminRow,
  AdminSection,
  AdminStatus,
  EmptyAdminState,
  formatAdminDate,
  formatIrr,
} from "@/features/admin/components/admin-ui";
import {
  adjustUserCreditsAction,
  approvePurchaseRequestAction,
  assignCreditPackAction,
  assignSubscriptionAction,
  createAdminUserAction,
  rejectPurchaseRequestAction,
  resetSubscriptionPeriodAction,
  updateAdminUserIdentityAction,
  updateAdminUserPasswordAction,
  updateSubscriptionStatusAction,
  updateUserRoleAction,
} from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { getUserCreditSummary } from "@/lib/billing";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams?: Promise<{ q?: string; userId?: string }>;
};

const inputClass = adminInputClass;
const labelClass = adminLabelClass;
const formPanelClass = "space-y-3 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/40 p-3";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      {children}
    </label>
  );
}

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

  const [users, subscriptionPackages, creditPackages, selectedUser, selectedCreditSummary, pendingRequestsCount] = await Promise.all([
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
    db.billingPackage.findMany({
      where: { type: "CREDIT_PACK", archivedAt: null },
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
    selectedUserId ? getUserCreditSummary(selectedUserId) : null,
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-5">
      <section className="grid gap-2.5 sm:grid-cols-3">
        <AdminMetric label="کاربران نمایش‌داده‌شده" value={users.length} />
        <AdminMetric label="درخواست خرید باز" value={pendingRequestsCount} />
        <AdminMetric label="بسته اشتراک" value={subscriptionPackages.length} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.4fr)] xl:items-start">
        <div className="space-y-4">
          <AdminSection
            title="کاربران"
            eyebrow="جست‌وجو و انتخاب پرونده"
            action={
              <a href="#new-user" className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs font-medium">
                <Add aria-hidden="true" className="h-3.5 w-3.5" />
                کاربر جدید
              </a>
            }
          >
            <form className="mb-4 flex flex-col gap-2 sm:flex-row">
              <input
                name="q"
                defaultValue={q}
                placeholder="نام، ایمیل، موبایل یا شناسه"
                className={inputClass}
              />
              <Button type="submit" size="sm" className="shrink-0">
                <SearchNormal1 aria-hidden="true" className="h-4 w-4" />
                جست‌وجو
              </Button>
            </form>

            <div className="space-y-2">
              {users.map((user) => {
                const activeSubscription = user.subscriptions[0];
                const selected = user.id === selectedUserId;
                return (
                  <Link
                    key={user.id}
                    href={`/admin/users?userId=${user.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    className={[
                      "block rounded-[var(--radius-md)] border px-3 py-3 text-sm transition",
                      selected ? "border-border-strong bg-surface-soft" : "border-border/60 bg-surface hover:border-border-strong",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{getUserDisplayName(user)}</p>
                        <p className="truncate text-xs text-muted" dir="ltr">{getUserIdentifier(user)}</p>
                      </div>
                      <AdminStatus status={user.role} />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {user.credits.toLocaleString("fa-IR")} اعتبار · {user._count.projects.toLocaleString("fa-IR")} پروژه · {user._count.assets.toLocaleString("fa-IR")} دارایی
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {activeSubscription ? `${activeSubscription.package.title} تا ${formatAdminDate(activeSubscription.currentPeriodEnd)}` : "بدون اشتراک فعال"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </AdminSection>

          <AdminSection title="کاربر جدید" eyebrow="اعتبار اولیه: ۱" >
            <form id="new-user" action={createAdminUserAction} className="space-y-3">
              <Field label="نام یا نام فروشگاه">
                <input name="name" required minLength={2} maxLength={80} className={inputClass} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Field label="ایمیل">
                  <input name="email" type="email" dir="ltr" className={`${inputClass} text-left`} />
                </Field>
                <Field label="موبایل">
                  <input name="phone" inputMode="tel" dir="ltr" className={`${inputClass} text-left`} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Field label="رمز عبور">
                  <input name="password" required minLength={6} type="password" dir="ltr" className={`${inputClass} text-left`} />
                </Field>
                <Field label="نقش">
                  <select name="role" defaultValue="USER" className={inputClass}>
                    <option value="USER">کاربر</option>
                    <option value="ADMIN">ادمین</option>
                  </select>
                </Field>
              </div>
              <Button type="submit" size="sm">
                <Add aria-hidden="true" className="h-4 w-4" />
                ساخت کاربر
              </Button>
            </form>
          </AdminSection>
        </div>

        {selectedUser ? (
          <div className="space-y-4">
            <AdminSection title="پرونده کاربر" eyebrow={getUserIdentifier(selectedUser)}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <AdminMetric label="اعتبار کل" value={selectedCreditSummary?.totalAvailableCredits ?? selectedUser.credits} />
                <AdminMetric label="کیف پول" value={selectedCreditSummary?.walletCredits ?? selectedUser.credits} />
                <AdminMetric label="اشتراک" value={selectedCreditSummary?.subscriptionCredits ?? 0} />
                <AdminMetric label="پروژه" value={selectedUser._count.projects} />
                <AdminMetric label="دارایی" value={selectedUser._count.assets} />
              </div>
            </AdminSection>

            <AdminSection title="فرم‌های اصلی" eyebrow="مشخصات، رمز، نقش، اعتبار، اشتراک">
              <div className="space-y-3">
                <form action={updateAdminUserIdentityAction} className={formPanelClass}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <UserEdit aria-hidden="true" className="h-4 w-4" />
                    مشخصات
                  </div>
                  <input type="hidden" name="userId" value={selectedUser.id} />
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="نام یا نام فروشگاه">
                      <input name="name" required minLength={2} maxLength={80} defaultValue={selectedUser.name ?? ""} className={inputClass} />
                    </Field>
                    <Field label="ایمیل">
                      <input name="email" type="email" dir="ltr" defaultValue={selectedUser.email ?? ""} className={`${inputClass} text-left`} />
                    </Field>
                    <Field label="موبایل">
                      <input name="phone" inputMode="tel" dir="ltr" defaultValue={selectedUser.phone ?? ""} className={`${inputClass} text-left`} />
                    </Field>
                  </div>
                  <Button type="submit" size="sm">
                    <Save2 aria-hidden="true" className="h-4 w-4" />
                    ذخیره مشخصات
                  </Button>
                </form>

                <form action={updateAdminUserPasswordAction} className={formPanelClass}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Key aria-hidden="true" className="h-4 w-4" />
                    تغییر رمز
                  </div>
                  <input type="hidden" name="userId" value={selectedUser.id} />
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <Field label="رمز جدید">
                      <input name="password" minLength={6} type="password" dir="ltr" className={`${inputClass} text-left`} />
                    </Field>
                    <Button type="submit" size="sm">تغییر رمز</Button>
                  </div>
                </form>

                <form action={updateUserRoleAction} className={formPanelClass}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldTick aria-hidden="true" className="h-4 w-4" />
                    نقش
                  </div>
                  <input type="hidden" name="userId" value={selectedUser.id} />
                  <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto] md:items-end">
                    <Field label="نقش">
                      <select name="role" defaultValue={selectedUser.role} className={inputClass}>
                        <option value="USER">کاربر</option>
                        <option value="ADMIN">ادمین</option>
                      </select>
                    </Field>
                    <Field label="تایید">
                      <input name="confirmRoleChange" placeholder="برای تایید بنویسید: تایید" className={inputClass} />
                    </Field>
                    <Button type="submit" size="sm">تغییر نقش</Button>
                  </div>
                </form>

                <form action={adjustUserCreditsAction} className={formPanelClass}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Wallet aria-hidden="true" className="h-4 w-4" />
                    اعتبار
                  </div>
                  <input type="hidden" name="userId" value={selectedUser.id} />
                  <div className="grid gap-3 md:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)_auto] md:items-end">
                    <Field label="تغییر">
                      <input name="delta" type="number" placeholder="+10 یا -2" className={`${inputClass} text-left`} dir="ltr" />
                    </Field>
                    <Field label="دلیل">
                      <input name="reason" placeholder="دلیل تغییر اعتبار" className={inputClass} />
                    </Field>
                    <Button type="submit" size="sm">
                      <Save2 aria-hidden="true" className="h-4 w-4" />
                      ثبت اعتبار
                    </Button>
                  </div>
                </form>

                <form action={assignCreditPackAction} className={formPanelClass}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Wallet aria-hidden="true" className="h-4 w-4" />
                    بسته اعتباری
                  </div>
                  <input type="hidden" name="userId" value={selectedUser.id} />
                  <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto] md:items-end">
                    <Field label="بسته">
                      <select name="packageId" className={inputClass}>
                        {creditPackages.map((billingPackage) => (
                          <option key={billingPackage.id} value={billingPackage.id}>
                            {billingPackage.title} · {billingPackage.credits.toLocaleString("fa-IR")} اعتبار
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="یادداشت">
                      <input name="notes" placeholder="یادداشت اختصاص اعتبار" className={inputClass} />
                    </Field>
                    <Button type="submit" size="sm" disabled={creditPackages.length === 0}>
                      افزودن به کیف پول
                    </Button>
                  </div>
                </form>

                <form action={assignSubscriptionAction} className={formPanelClass}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldTick aria-hidden="true" className="h-4 w-4" />
                    اشتراک
                  </div>
                  <input type="hidden" name="userId" value={selectedUser.id} />
                  <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto] md:items-end">
                    <Field label="بسته">
                      <select name="packageId" className={inputClass}>
                        {subscriptionPackages.map((billingPackage) => (
                          <option key={billingPackage.id} value={billingPackage.id}>{billingPackage.title}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="یادداشت">
                      <input name="notes" placeholder="یادداشت اختصاص اشتراک" className={inputClass} />
                    </Field>
                    <Button type="submit" size="sm">اختصاص اشتراک</Button>
                  </div>
                </form>
              </div>
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
                      {request.receiptImageUrl ? (
                        <a href={request.receiptImageUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-medium text-accent-deep">
                          مشاهده رسید پرداخت
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-danger">رسید هنوز ارسال نشده است.</p>
                      )}
                      {request.receiptNote ? <p className="mt-1 text-xs text-muted">{request.receiptNote}</p> : null}
                    </div>
                    <AdminStatus status={request.status} />
                    {request.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <form action={approvePurchaseRequestAction}>
                          <input type="hidden" name="requestId" value={request.id} />
                          <button className={adminPrimaryActionClass}>
                            <TickCircle aria-hidden="true" className="h-3.5 w-3.5" />
                            تایید
                          </button>
                        </form>
                        <form action={rejectPurchaseRequestAction}>
                          <input type="hidden" name="requestId" value={request.id} />
                          <button className={adminDangerActionClass}>رد</button>
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
                          <Refresh aria-hidden="true" className="h-3.5 w-3.5" />
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
        ) : (
          <AdminSection title="پرونده کاربر" eyebrow="ابتدا یک کاربر را انتخاب کنید">
            <EmptyAdminState>از فهرست سمت راست یک کاربر را انتخاب کنید یا کاربر جدید بسازید.</EmptyAdminState>
          </AdminSection>
        )}
      </div>
    </div>
  );
}
