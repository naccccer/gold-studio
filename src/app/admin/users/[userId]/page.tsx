import Link from "next/link";
import { notFound } from "next/navigation";
import { Add, Key, Refresh, ShieldTick, UserEdit, Wallet } from "vuesax-icons-react";
import {
  adminDangerActionClass,
  adminInputClass,
  adminPrimaryActionClass,
  adminSecondaryActionClass,
  adminTableCellClass,
  AdminDataTable,
  AdminDescriptionList,
  AdminEmptyState,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
  formatIrr,
} from "@/features/admin/components/admin-ui";
import {
  adjustUserCreditsAction,
  approvePurchaseRequestAction,
  assignCreditPackAction,
  assignSubscriptionAction,
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
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AdminUserDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { userId } = await params;
  const [user, creditSummary, subscriptionPackages, creditPackages] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        projects: { orderBy: { createdAt: "desc" }, take: 8, include: { style: { select: { name: true } } } },
        assets: { orderBy: { createdAt: "desc" }, take: 8 },
        subscriptions: { orderBy: { createdAt: "desc" }, take: 10, include: { package: true } },
        purchaseRequests: { orderBy: { createdAt: "desc" }, take: 10, include: { package: true } },
        creditEvents: { orderBy: { createdAt: "desc" }, take: 12, include: { package: true } },
        _count: { select: { projects: true, assets: true, purchaseRequests: true } },
      },
    }),
    getUserCreditSummary(userId),
    db.billingPackage.findMany({ where: { type: "SUBSCRIPTION", archivedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    db.billingPackage.findMany({ where: { type: "CREDIT_PACK", archivedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);

  if (!user) notFound();

  return (
    <>
      <AdminPageHeader
        title={getUserDisplayName(user)}
        description={getUserIdentifier(user)}
        actions={<Link href="/admin/users" className={adminSecondaryActionClass}>بازگشت به کاربران</Link>}
      />

      <AdminKpiStrip>
        <AdminKpi label="اعتبار قابل استفاده" value={creditSummary.totalAvailableCredits} />
        <AdminKpi label="کیف پول" value={creditSummary.walletCredits} />
        <AdminKpi label="اشتراک" value={creditSummary.subscriptionCredits} />
        <AdminKpi label="پروژه‌ها" value={user._count.projects} />
        <AdminKpi label="دارایی‌ها" value={user._count.assets} />
        <AdminKpi label="خریدها" value={user._count.purchaseRequests} />
      </AdminKpiStrip>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          <AdminPanel title="پرونده" description="شناسه، نقش و وضعیت اصلی کاربر.">
            <div className="p-4">
              <AdminDescriptionList
                items={[
                  { label: "شناسه", value: user.id, dir: "ltr" },
                  { label: "نقش", value: <AdminStatus status={user.role} /> },
                  { label: "کد معرف", value: user.referralCode || "ندارد", dir: "ltr" },
                  { label: "عضویت", value: formatAdminDate(user.createdAt) },
                ]}
              />
            </div>
          </AdminPanel>

          <AdminPanel title="مشخصات" description="ویرایش نام، ایمیل و موبایل.">
            <form action={updateAdminUserIdentityAction} className="grid gap-3 p-4">
              <input type="hidden" name="userId" value={user.id} />
              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                نام یا فروشگاه
                <input name="name" required minLength={2} maxLength={80} defaultValue={user.name ?? ""} className={adminInputClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                ایمیل
                <input name="email" type="email" dir="ltr" defaultValue={user.email ?? ""} className={`${adminInputClass} text-left`} />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-muted">
                موبایل
                <input name="phone" inputMode="tel" dir="ltr" defaultValue={user.phone ?? ""} className={`${adminInputClass} text-left`} />
              </label>
              <button className={adminPrimaryActionClass}>
                <UserEdit className="h-4 w-4" />
                ذخیره مشخصات
              </button>
            </form>
          </AdminPanel>

          <AdminPanel title="امنیت و نقش" description="عملیات حساس با تایید صریح.">
            <div className="grid gap-3 p-4">
              <form action={updateAdminUserPasswordAction} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <input type="hidden" name="userId" value={user.id} />
                <label className="grid gap-1.5 text-xs font-semibold text-muted">
                  رمز جدید
                  <input name="password" minLength={6} type="password" dir="ltr" className={`${adminInputClass} text-left`} />
                </label>
                <button className={adminSecondaryActionClass}>
                  <Key className="h-4 w-4" />
                  تغییر رمز
                </button>
              </form>
              <form action={updateUserRoleAction} className="grid gap-2 md:grid-cols-[150px_minmax(0,1fr)_auto] md:items-end">
                <input type="hidden" name="userId" value={user.id} />
                <label className="grid gap-1.5 text-xs font-semibold text-muted">
                  نقش
                  <select name="role" defaultValue={user.role} className={adminInputClass}>
                    <option value="USER">کاربر</option>
                    <option value="ADMIN">ادمین</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-muted">
                  تایید
                  <input name="confirmRoleChange" placeholder="برای تایید بنویسید: تایید" className={adminInputClass} />
                </label>
                <button className={adminDangerActionClass}>
                  <ShieldTick className="h-4 w-4" />
                  تغییر نقش
                </button>
              </form>
            </div>
          </AdminPanel>
        </div>

        <div className="space-y-4">
          <AdminPanel title="اعتبار و اشتراک" description="افزایش/کاهش دستی اعتبار، اختصاص بسته و تمدید دوره.">
            <div className="grid gap-3 p-4">
              <form action={adjustUserCreditsAction} className="grid gap-2 lg:grid-cols-[120px_minmax(0,1fr)_auto] lg:items-end">
                <input type="hidden" name="userId" value={user.id} />
                <label className="grid gap-1.5 text-xs font-semibold text-muted">
                  تغییر
                  <input name="delta" type="number" placeholder="+10 یا -2" className={`${adminInputClass} text-left`} dir="ltr" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-muted">
                  دلیل
                  <input name="reason" placeholder="دلیل تغییر اعتبار" className={adminInputClass} />
                </label>
                <button className={adminPrimaryActionClass}>
                  <Wallet className="h-4 w-4" />
                  ثبت
                </button>
              </form>

              <form action={assignCreditPackAction} className="grid gap-2 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
                <input type="hidden" name="userId" value={user.id} />
                <label className="grid gap-1.5 text-xs font-semibold text-muted">
                  بسته اعتبار
                  <select name="packageId" className={adminInputClass}>
                    {creditPackages.map((billingPackage) => (
                      <option key={billingPackage.id} value={billingPackage.id}>{billingPackage.title} · {billingPackage.credits.toLocaleString("fa-IR")}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-muted">
                  یادداشت
                  <input name="notes" className={adminInputClass} />
                </label>
                <button className={adminSecondaryActionClass} disabled={creditPackages.length === 0}>
                  <Add className="h-4 w-4" />
                  افزودن
                </button>
              </form>

              <form action={assignSubscriptionAction} className="grid gap-2 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
                <input type="hidden" name="userId" value={user.id} />
                <label className="grid gap-1.5 text-xs font-semibold text-muted">
                  اشتراک
                  <select name="packageId" className={adminInputClass}>
                    {subscriptionPackages.map((billingPackage) => (
                      <option key={billingPackage.id} value={billingPackage.id}>{billingPackage.title}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-muted">
                  یادداشت
                  <input name="notes" className={adminInputClass} />
                </label>
                <button className={adminSecondaryActionClass} disabled={subscriptionPackages.length === 0}>
                  <ShieldTick className="h-4 w-4" />
                  اختصاص
                </button>
              </form>
            </div>
          </AdminPanel>

          <AdminPanel title="اشتراک‌ها">
            <AdminDataTable headers={["بسته", "مصرف", "وضعیت", "عملیات"]} empty={<AdminEmptyState title="اشتراکی ثبت نشده است." />}>
              {user.subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className={adminTableCellClass}>
                    <p className="font-semibold text-foreground">{subscription.package.title}</p>
                    <p className="text-xs text-muted">پایان {formatAdminDate(subscription.currentPeriodEnd)}</p>
                  </td>
                  <td className={adminTableCellClass}>{subscription.creditsUsedThisPeriod.toLocaleString("fa-IR")} / {subscription.creditsPerPeriod.toLocaleString("fa-IR")}</td>
                  <td className={adminTableCellClass}><AdminStatus status={subscription.status} /></td>
                  <td className={adminTableCellClass}>
                    <div className="flex flex-wrap gap-2">
                      <form action={updateSubscriptionStatusAction} className="flex gap-2">
                        <input type="hidden" name="subscriptionId" value={subscription.id} />
                        <select name="status" defaultValue={subscription.status} className={adminInputClass}>
                          <option value="ACTIVE">فعال</option>
                          <option value="PAUSED">متوقف</option>
                          <option value="CANCELED">لغوشده</option>
                          <option value="EXPIRED">منقضی</option>
                        </select>
                        <button className={adminPrimaryActionClass}>ثبت</button>
                      </form>
                      <form action={resetSubscriptionPeriodAction}>
                        <input type="hidden" name="subscriptionId" value={subscription.id} />
                        <button className={adminSecondaryActionClass}>
                          <Refresh className="h-4 w-4" />
                          تمدید
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminDataTable>
          </AdminPanel>
        </div>
      </div>

      <AdminPanel title="درخواست‌های خرید">
        <AdminDataTable headers={["بسته", "مبلغ", "رسید", "وضعیت", "عملیات"]} empty={<AdminEmptyState title="درخواست خریدی ثبت نشده است." />}>
          {user.purchaseRequests.map((request) => (
            <tr key={request.id}>
              <td className={adminTableCellClass}>
                <p className="font-semibold text-foreground">{request.package.title}</p>
                <p className="text-xs text-muted">{formatAdminDate(request.createdAt)}</p>
              </td>
              <td className={adminTableCellClass}>{formatIrr(request.amount, request.currency)}</td>
              <td className={adminTableCellClass}>
                {storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl) ? (
                  <a href={storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl) ?? ""} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent-deep">مشاهده رسید</a>
                ) : (
                  <span className="text-xs text-danger">بدون رسید</span>
                )}
              </td>
              <td className={adminTableCellClass}><AdminStatus status={request.status} /></td>
              <td className={adminTableCellClass}>
                {request.status === "PENDING" ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={approvePurchaseRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button className={adminPrimaryActionClass}>تایید</button>
                    </form>
                    <form action={rejectPurchaseRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button className={adminDangerActionClass}>رد</button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-muted">ثبت‌شده</span>
                )}
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel title="دفتر اعتبار">
          <AdminDataTable headers={["تغییر", "منبع", "دلیل", "زمان"]} empty={<AdminEmptyState title="رویداد اعتباری ثبت نشده است." />}>
            {user.creditEvents.map((event) => (
              <tr key={event.id}>
                <td className={adminTableCellClass}>
                  <p className={event.delta >= 0 ? "font-semibold text-accent-deep" : "font-semibold text-danger"}>{event.delta.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-muted">{event.balanceBefore.toLocaleString("fa-IR")} → {event.balanceAfter.toLocaleString("fa-IR")}</p>
                </td>
                <td className={adminTableCellClass}><AdminStatus status={event.source} /></td>
                <td className={adminTableCellClass}>{event.reason}</td>
                <td className={adminTableCellClass}>{formatAdminDate(event.createdAt)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="آخرین پروژه‌ها و دارایی‌ها">
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted">پروژه‌ها</h3>
              <div className="divide-y divide-border/60 rounded-[var(--radius-md)] border border-border/70">
                {user.projects.length === 0 ? <p className="p-3 text-xs text-muted">پروژه‌ای ندارد.</p> : user.projects.map((project) => (
                  <Link key={project.id} href={`/admin/projects/${project.id}`} className="block px-3 py-2 hover:bg-surface-soft/45">
                    <p className="truncate text-sm font-semibold text-foreground">{project.title || "پروژه بدون عنوان"}</p>
                    <p className="text-xs text-muted">{project.style.name} · {formatAdminDate(project.createdAt)}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-muted">دارایی‌ها</h3>
              <div className="divide-y divide-border/60 rounded-[var(--radius-md)] border border-border/70">
                {user.assets.length === 0 ? <p className="p-3 text-xs text-muted">دارایی‌ای ندارد.</p> : user.assets.map((asset) => (
                  <Link key={asset.id} href={`/admin/assets?q=${asset.id}`} className="block px-3 py-2 hover:bg-surface-soft/45">
                    <p className="truncate text-sm font-semibold text-foreground">{asset.title || asset.originalName || "تصویر بدون نام"}</p>
                    <p className="truncate text-xs text-muted" dir="ltr">{asset.storageKey}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>
    </>
  );
}
