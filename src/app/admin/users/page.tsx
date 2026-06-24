import Link from "next/link";
import { Add, SearchNormal1 } from "vuesax-icons-react";
import type { Prisma } from "@/generated/prisma";
import {
  btnSecondary,
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  Disclosure,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  inlineFieldClass,
  formatAdminDate,
  SegmentedLinks,
  StatusDot,
  Surface,
} from "@/features/admin/components/console";
import { createAdminUserAction } from "@/features/admin/actions";
import { requireAdminOrSalesSession } from "@/lib/auth/session";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { creditUnitsToVisibleCredits, visibleCreditsToCreditUnits } from "@/lib/credit-units";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams?: Promise<{ q?: string; role?: string; credit?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await requireAdminOrSalesSession();
  const isAdmin = session.role === "ADMIN";
  const params = await searchParams;
  const q = params?.q?.trim();
  const role = params?.role;
  const credit = params?.credit;

  const where: Prisma.UserWhereInput = {
    ...(role === "ADMIN" || role === "USER" || role === "SALES" ? { role: role as "ADMIN" | "USER" | "SALES" } : {}),
    ...(credit === "low" ? { credits: { lte: visibleCreditsToCreditUnits(1) } } : {}),
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

  const [users, totalUsers, adminUsers, salesUsers, lowCreditUsers] = await Promise.all([
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
    db.user.count({ where: { role: "SALES" } }),
    db.user.count({ where: { credits: { lte: visibleCreditsToCreditUnits(1) } } }),
  ]);

  const filterQuery = (next: { role?: string; credit?: string }) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (next.role) query.set("role", next.role);
    if (next.credit) query.set("credit", next.credit);
    const value = query.toString();
    return `/admin/users${value ? `?${value}` : ""}`;
  };

  return (
    <>
      <ConsoleHeader title="کاربران" meta={<span>{faNum(totalUsers)} کاربر ثبت‌شده</span>} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedLinks
          items={[
            { href: filterQuery({}), label: "همه", active: !role && credit !== "low" },
            { href: filterQuery({ role: "USER" }), label: "کاربران", active: role === "USER" },
            { href: filterQuery({ role: "ADMIN" }), label: "ادمین‌ها", active: role === "ADMIN", count: adminUsers },
            { href: filterQuery({ role: "SALES" }), label: "فروش", active: role === "SALES", count: salesUsers },
            { href: filterQuery({ credit: "low" }), label: "کم‌اعتبار", active: credit === "low", count: lowCreditUsers },
          ]}
        />
        <form className="flex items-center gap-2">
          {role ? <input type="hidden" name="role" value={role} /> : null}
          {credit ? <input type="hidden" name="credit" value={credit} /> : null}
          <input name="q" defaultValue={q} placeholder="نام، ایمیل، موبایل، شناسه یا کد معرف" className={`${inlineFieldClass} w-64`} />
          <button className={`${btnSecondary} h-8`} aria-label="جست‌وجو">
            <SearchNormal1 className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      <Surface>
        <ConsoleTable
          head={["کاربر", "نقش", "اعتبار", "اشتراک", "فعالیت", "آخرین تغییر"]}
          empty={<EmptyState title="کاربری با این فیلتر پیدا نشد." />}
        >
          {users.map((user) => {
            const subscription = user.subscriptions[0];
            return (
              <tr key={user.id}>
                <td className={cellClass}>
                  <Link href={`/admin/users/${user.id}`} className="font-medium hover:text-navy-700 hover:underline">
                    {getUserDisplayName(user)}
                  </Link>
                  <p className="text-xs text-slate-400" dir="ltr">
                    {getUserIdentifier(user)}
                  </p>
                </td>
                <td className={cellClass}>
                  <StatusDot status={user.role} />
                </td>
                <td className={`${cellClass} tabular-nums`}>
                  {faNum(creditUnitsToVisibleCredits(user.credits))}
                  {user.reservedCredits > 0 ? <p className="text-xs text-slate-400">رزرو {faNum(creditUnitsToVisibleCredits(user.reservedCredits))}</p> : null}
                </td>
                <td className={cellClass}>
                  {subscription ? (
                    <>
                      <p className="font-medium">{subscription.customTitle || subscription.package?.title || "پلن اختصاصی"}</p>
                      <p className="text-xs text-slate-400">تا {formatAdminDate(subscription.currentPeriodEnd)}</p>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">ندارد</span>
                  )}
                </td>
                <td className={`${cellClass} text-xs text-slate-500`}>
                  {faNum(user._count.projects)} پروژه · {faNum(user._count.assets)} دارایی · {faNum(user._count.purchaseRequests)} خرید
                </td>
                <td className={`${cellClass} text-xs text-slate-500`}>{formatAdminDate(user.updatedAt)}</td>
              </tr>
            );
          })}
        </ConsoleTable>
      </Surface>

      {isAdmin ? (
      <Disclosure
        summary={
          <>
            <Add className="h-4 w-4 text-slate-400" />
            ساخت کاربر جدید
          </>
        }
      >
        <form action={createAdminUserAction} className="grid max-w-2xl gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نام یا فروشگاه">
              <input name="name" required minLength={2} maxLength={80} className={fieldClass} />
            </Field>
            <Field label="رمز عبور">
              <input name="password" type="password" required minLength={6} dir="ltr" className={`${fieldClass} text-left`} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ایمیل">
              <input name="email" type="email" dir="ltr" className={`${fieldClass} text-left`} />
            </Field>
            <Field label="موبایل">
              <input name="phone" inputMode="tel" dir="ltr" className={`${fieldClass} text-left`} />
            </Field>
          </div>
          <Field label="نقش">
            <select name="role" defaultValue="USER" className={`${fieldClass} sm:max-w-48`}>
              <option value="USER">کاربر</option>
              <option value="SALES">فروش</option>
              <option value="ADMIN">ادمین</option>
            </select>
          </Field>
          <div className="border-t border-slate-100 pt-3">
            <button className={btnSecondary}>
              <Add className="h-4 w-4" />
              ساخت کاربر
            </button>
          </div>
        </form>
      </Disclosure>
      ) : null}
    </>
  );
}
