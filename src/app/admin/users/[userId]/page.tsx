import Link from "next/link";
import { notFound } from "next/navigation";
import { Add, Key, Refresh, ShieldTick, UserEdit, Wallet } from "vuesax-icons-react";
import type { Prisma } from "@/generated/prisma";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  Disclosure,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  formatAdminDate,
  formatAdminFullDate,
  formatIrr,
  KeyValueList,
  StatBar,
  StatusDot,
  Surface,
  TabNav,
} from "@/features/admin/components/console";
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

const tabs = [
  { key: "overview", label: "پرونده" },
  { key: "billing", label: "اعتبار و خرید" },
  { key: "activity", label: "فعالیت" },
  { key: "security", label: "امنیت" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

type AdminUserDetailPageProps = {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

export default async function AdminUserDetailPage({ params, searchParams }: AdminUserDetailPageProps) {
  const { userId } = await params;
  const query = await searchParams;
  const activeTab: TabKey = tabs.some((tab) => tab.key === query?.tab) ? (query?.tab as TabKey) : "overview";

  const [user, creditSummary, subscriptionPackages, creditPackages] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        projects: { orderBy: { createdAt: "desc" }, take: 10, include: { style: { select: { name: true } } } },
        assets: { orderBy: { createdAt: "desc" }, take: 10 },
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

  const tabHref = (tab: TabKey) => `/admin/users/${user.id}${tab === "overview" ? "" : `?tab=${tab}`}`;

  return (
    <>
      <ConsoleHeader
        backHref="/admin/users"
        backLabel="کاربران"
        title={getUserDisplayName(user)}
        meta={
          <>
            <span dir="ltr">{getUserIdentifier(user)}</span>
            <StatusDot status={user.role} />
            <span>عضویت {formatAdminDate(user.createdAt)}</span>
          </>
        }
      />

      <StatBar
        items={[
          { label: "اعتبار قابل استفاده", value: creditSummary.totalAvailableCredits },
          { label: "کیف پول", value: creditSummary.walletCredits },
          { label: "اعتبار اشتراک", value: creditSummary.subscriptionCredits },
          { label: "پروژه", value: user._count.projects },
          { label: "دارایی", value: user._count.assets },
          { label: "خرید", value: user._count.purchaseRequests },
        ]}
      />

      <TabNav tabs={tabs.map((tab) => ({ href: tabHref(tab.key), label: tab.label, active: activeTab === tab.key }))} />

      {activeTab === "overview" ? (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Surface className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-navy-950">مشخصات پرونده</h2>
            <KeyValueList
              items={[
                { label: "شناسه", value: user.id, dir: "ltr" },
                { label: "نام یا فروشگاه", value: user.name ?? "ثبت نشده" },
                { label: "ایمیل", value: user.email ?? "ندارد", dir: "ltr" },
                { label: "موبایل", value: user.phone ?? "ندارد", dir: "ltr" },
                { label: "کد معرف", value: user.referralCode || "ندارد", dir: "ltr" },
                { label: "تاریخ عضویت", value: formatAdminFullDate(user.createdAt) },
              ]}
            />
          </Surface>
          <Surface className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-navy-950">آخرین پروژه‌ها</h2>
            {user.projects.length === 0 ? (
              <EmptyState title="پروژه‌ای ندارد." />
            ) : (
              <div className="divide-y divide-slate-100">
                {user.projects.slice(0, 6).map((project) => (
                  <Link key={project.id} href={`/admin/projects/${project.id}`} className="flex items-center justify-between gap-3 py-2.5 transition first:pt-0 last:pb-0 hover:opacity-70">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-navy-950">{project.title || "پروژه بدون عنوان"}</span>
                      <span className="block text-xs text-slate-400">
                        {project.style.name} · {formatAdminDate(project.createdAt)}
                      </span>
                    </span>
                    <StatusDot status={project.status} />
                  </Link>
                ))}
              </div>
            )}
          </Surface>
        </div>
      ) : null}

      {activeTab === "billing" ? (
        <BillingTab
          user={user}
          subscriptionPackages={subscriptionPackages}
          creditPackages={creditPackages}
        />
      ) : null}

      {activeTab === "activity" ? <ActivityTab user={user} /> : null}
      {activeTab === "security" ? <SecurityTab user={user} /> : null}
    </>
  );
}

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    projects: { include: { style: { select: { name: true } } } };
    assets: true;
    subscriptions: { include: { package: true } };
    purchaseRequests: { include: { package: true } };
    creditEvents: { include: { package: true } };
    _count: { select: { projects: true; assets: true; purchaseRequests: true } };
  };
}>;

type BillingPackage = Awaited<ReturnType<typeof db.billingPackage.findMany>>[number];

function BillingTab({
  user,
  subscriptionPackages,
  creditPackages,
}: {
  user: UserWithRelations;
  subscriptionPackages: BillingPackage[];
  creditPackages: BillingPackage[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Disclosure
          summary={
            <>
              <Wallet className="h-4 w-4 text-slate-400" />
              تغییر دستی اعتبار
            </>
          }
        >
          <form action={adjustUserCreditsAction} className="grid gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <Field label="تغییر (مثبت یا منفی)">
              <input name="delta" type="number" required placeholder="+10 یا -2" dir="ltr" className={`${fieldClass} text-left`} />
            </Field>
            <Field label="دلیل">
              <input name="reason" required placeholder="دلیل تغییر اعتبار" className={fieldClass} />
            </Field>
            <div>
              <button className={btnPrimary}>ثبت تغییر</button>
            </div>
          </form>
        </Disclosure>

        <Disclosure
          summary={
            <>
              <Add className="h-4 w-4 text-slate-400" />
              افزودن بسته اعتبار
            </>
          }
        >
          <form action={assignCreditPackAction} className="grid gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <Field label="بسته اعتبار">
              <select name="packageId" className={fieldClass}>
                {creditPackages.map((billingPackage) => (
                  <option key={billingPackage.id} value={billingPackage.id}>
                    {billingPackage.title} · {faNum(billingPackage.credits)} اعتبار
                  </option>
                ))}
              </select>
            </Field>
            <Field label="یادداشت">
              <input name="notes" className={fieldClass} />
            </Field>
            <div>
              <button className={btnPrimary} disabled={creditPackages.length === 0}>
                افزودن بسته
              </button>
            </div>
          </form>
        </Disclosure>

        <Disclosure
          summary={
            <>
              <ShieldTick className="h-4 w-4 text-slate-400" />
              اختصاص اشتراک
            </>
          }
        >
          <form action={assignSubscriptionAction} className="grid gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <Field label="اشتراک">
              <select name="packageId" className={fieldClass}>
                {subscriptionPackages.map((billingPackage) => (
                  <option key={billingPackage.id} value={billingPackage.id}>
                    {billingPackage.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="یادداشت">
              <input name="notes" className={fieldClass} />
            </Field>
            <div>
              <button className={btnPrimary} disabled={subscriptionPackages.length === 0}>
                اختصاص اشتراک
              </button>
            </div>
          </form>
        </Disclosure>
      </div>

      <Surface>
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy-950">اشتراک‌ها</h2>
        </div>
        <ConsoleTable head={["بسته", "مصرف دوره", "وضعیت", ""]} empty={<EmptyState title="اشتراکی ثبت نشده است." />}>
          {user.subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td className={cellClass}>
                <p className="font-medium">{subscription.package.title}</p>
                <p className="text-xs text-slate-400">پایان دوره {formatAdminDate(subscription.currentPeriodEnd)}</p>
              </td>
              <td className={`${cellClass} tabular-nums`}>
                {faNum(subscription.creditsUsedThisPeriod)} / {faNum(subscription.creditsPerPeriod)}
              </td>
              <td className={cellClass}>
                <StatusDot status={subscription.status} />
              </td>
              <td className={cellClass}>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <form action={updateSubscriptionStatusAction} className="flex gap-1.5">
                    <input type="hidden" name="subscriptionId" value={subscription.id} />
                    <select name="status" defaultValue={subscription.status} className={`${fieldClass} h-8 w-28 text-xs`}>
                      <option value="ACTIVE">فعال</option>
                      <option value="PAUSED">متوقف</option>
                      <option value="CANCELED">لغوشده</option>
                      <option value="EXPIRED">منقضی</option>
                    </select>
                    <button className={`${btnSecondary} h-8`}>ثبت</button>
                  </form>
                  <form action={resetSubscriptionPeriodAction}>
                    <input type="hidden" name="subscriptionId" value={subscription.id} />
                    <button className={`${btnSecondary} h-8`}>
                      <Refresh className="h-3.5 w-3.5" />
                      تمدید دوره
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </ConsoleTable>
      </Surface>

      <Surface>
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy-950">درخواست‌های خرید</h2>
        </div>
        <ConsoleTable head={["بسته", "مبلغ", "رسید", "وضعیت", ""]} empty={<EmptyState title="درخواست خریدی ثبت نشده است." />}>
          {user.purchaseRequests.map((request) => {
            const receiptUrl = storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl);
            return (
              <tr key={request.id}>
                <td className={cellClass}>
                  <p className="font-medium">{request.package.title}</p>
                  <p className="text-xs text-slate-400">{formatAdminDate(request.createdAt)}</p>
                </td>
                <td className={`${cellClass} tabular-nums`}>{formatIrr(request.amount, request.currency)}</td>
                <td className={cellClass}>
                  {receiptUrl ? (
                    <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-navy-700 hover:underline">
                      مشاهده رسید
                    </a>
                  ) : (
                    <span className="text-xs text-rose-600">بدون رسید</span>
                  )}
                </td>
                <td className={cellClass}>
                  <StatusDot status={request.status} />
                </td>
                <td className={cellClass}>
                  {request.status === "PENDING" ? (
                    <div className="flex justify-end gap-1.5">
                      <form action={approvePurchaseRequestAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <button className={btnPrimary}>تایید</button>
                      </form>
                      <form action={rejectPurchaseRequestAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <button className={btnDanger}>رد</button>
                      </form>
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </ConsoleTable>
      </Surface>

      <Disclosure summary={`دفتر اعتبار (${faNum(user.creditEvents.length)} رویداد اخیر)`}>
        {user.creditEvents.length === 0 ? (
          <EmptyState title="رویداد اعتباری ثبت نشده است." />
        ) : (
          <div className="divide-y divide-slate-100">
            {user.creditEvents.map((event) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0">
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`w-12 shrink-0 font-semibold tabular-nums ${event.delta >= 0 ? "text-emerald-700" : "text-rose-700"}`} dir="ltr">
                    {event.delta > 0 ? `+${faNum(event.delta)}` : faNum(event.delta)}
                  </span>
                  <span className="truncate text-xs text-slate-500">{event.reason}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
                  <span className="tabular-nums" dir="ltr">
                    {faNum(event.balanceBefore)} ← {faNum(event.balanceAfter)}
                  </span>
                  {formatAdminDate(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Disclosure>
    </div>
  );
}

function ActivityTab({ user }: { user: UserWithRelations }) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Surface className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-navy-950">پروژه‌ها</h2>
        {user.projects.length === 0 ? (
          <EmptyState title="پروژه‌ای ندارد." />
        ) : (
          <div className="divide-y divide-slate-100">
            {user.projects.map((project) => (
              <Link key={project.id} href={`/admin/projects/${project.id}`} className="flex items-center justify-between gap-3 py-2.5 transition first:pt-0 last:pb-0 hover:opacity-70">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-navy-950">{project.title || "پروژه بدون عنوان"}</span>
                  <span className="block text-xs text-slate-400">
                    {project.style.name} · {formatAdminDate(project.createdAt)}
                  </span>
                </span>
                <StatusDot status={project.status} />
              </Link>
            ))}
          </div>
        )}
      </Surface>
      <Surface className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-navy-950">دارایی‌های گالری</h2>
        {user.assets.length === 0 ? (
          <EmptyState title="دارایی‌ای ندارد." />
        ) : (
          <div className="divide-y divide-slate-100">
            {user.assets.map((asset) => (
              <Link key={asset.id} href={`/admin/assets?q=${asset.id}`} className="block py-2.5 transition first:pt-0 last:pb-0 hover:opacity-70">
                <span className="block truncate text-sm font-medium text-navy-950">
                  {asset.title || asset.originalName || "تصویر بدون نام"}
                </span>
                <span className="block truncate text-xs text-slate-400" dir="ltr">
                  {asset.storageKey}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}

function SecurityTab({ user }: { user: UserWithRelations }) {
  return (
    <div className="grid max-w-2xl gap-4">
      <Surface className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-navy-950">ویرایش مشخصات</h2>
        <form action={updateAdminUserIdentityAction} className="grid gap-3">
          <input type="hidden" name="userId" value={user.id} />
          <Field label="نام یا فروشگاه">
            <input name="name" required minLength={2} maxLength={80} defaultValue={user.name ?? ""} className={fieldClass} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ایمیل">
              <input name="email" type="email" dir="ltr" defaultValue={user.email ?? ""} className={`${fieldClass} text-left`} />
            </Field>
            <Field label="موبایل">
              <input name="phone" inputMode="tel" dir="ltr" defaultValue={user.phone ?? ""} className={`${fieldClass} text-left`} />
            </Field>
          </div>
          <div>
            <button className={btnPrimary}>
              <UserEdit className="h-4 w-4" />
              ذخیره مشخصات
            </button>
          </div>
        </form>
      </Surface>

      <Disclosure
        summary={
          <>
            <Key className="h-4 w-4 text-slate-400" />
            تغییر رمز عبور
          </>
        }
      >
        <form action={updateAdminUserPasswordAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <input type="hidden" name="userId" value={user.id} />
          <Field label="رمز جدید">
            <input name="password" required minLength={6} type="password" dir="ltr" className={`${fieldClass} text-left`} />
          </Field>
          <button className={btnSecondary}>ثبت رمز جدید</button>
        </form>
      </Disclosure>

      <Disclosure
        tone="danger"
        summary={
          <>
            <ShieldTick className="h-4 w-4 text-rose-400" />
            تغییر نقش (عملیات حساس)
          </>
        }
      >
        <form action={updateUserRoleAction} className="grid gap-3">
          <input type="hidden" name="userId" value={user.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نقش">
              <select name="role" defaultValue={user.role} className={fieldClass}>
                <option value="USER">کاربر</option>
                <option value="ADMIN">ادمین</option>
              </select>
            </Field>
            <Field label="تایید" hint="برای تایید بنویسید: تایید">
              <input name="confirmRoleChange" required className={fieldClass} />
            </Field>
          </div>
          <div>
            <button className={btnDanger}>اعمال تغییر نقش</button>
          </div>
        </form>
      </Disclosure>
    </div>
  );
}
