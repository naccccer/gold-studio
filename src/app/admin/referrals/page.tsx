import Link from "next/link";
import { Ticket } from "vuesax-icons-react";
import {
  btnPrimary,
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  Disclosure,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  formatAdminDate,
  StatBar,
  StatusDot,
  Surface,
  TabNav,
  textareaClass,
} from "@/features/admin/components/console";
import { createSalesReferralCodesAction } from "@/features/admin/actions";
import { CopySalesCodesButton } from "@/features/admin/components/copy-sales-codes-button";
import { requireAdminOrSalesSession } from "@/lib/auth/session";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { creditUnitsToVisibleCredits } from "@/lib/credit-units";
import { SALES_CODE_BATCH_SIZE, SALES_CODE_CREDITS } from "@/lib/credits";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminReferralsPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function AdminReferralsPage({ searchParams }: AdminReferralsPageProps) {
  const session = await requireAdminOrSalesSession();
  const isAdmin = session.role === "ADMIN";
  const params = await searchParams;
  const activeTab = params?.tab === "referrals" ? "referrals" : "codes";

  const [codes, totalCodes, redeemedCodes, pendingReferralRewards, referrals, salesUsers] = await Promise.all([
    db.salesReferralCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        createdByAdmin: { select: { name: true, email: true, phone: true } },
        salesUser: { select: { id: true, name: true, email: true, phone: true } },
        redeemedByUser: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    db.salesReferralCode.count(),
    db.salesReferralCode.count({ where: { redeemedAt: { not: null } } }),
    db.referral.count({ where: { rewardGrantedAt: null } }),
    db.referral.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        inviter: { select: { id: true, name: true, email: true, phone: true } },
        invitee: { select: { id: true, name: true, email: true, phone: true } },
        rewardPurchaseRequest: { select: { id: true, status: true } },
      },
    }),
    isAdmin
      ? db.user.findMany({
          where: { role: "SALES" },
          orderBy: [{ name: "asc" }, { createdAt: "desc" }],
          select: { id: true, name: true, email: true, phone: true },
        })
      : Promise.resolve([]),
  ]);

  const unusedCodes = totalCodes - redeemedCodes;
  const copyableCodes = codes.filter((code) => !code.redeemedAt).map((code) => code.code);
  const batches = codes.reduce<Map<string, typeof codes>>((map, code) => {
    map.set(code.batchKey, [...(map.get(code.batchKey) ?? []), code]);
    return map;
  }, new Map());
  const latestBatches = Array.from(batches.entries()).slice(0, 8);

  return (
    <>
      <ConsoleHeader title="معرفی و فروش" actions={<CopySalesCodesButton codes={copyableCodes} />} />

      <StatBar
        items={[
          { label: "کد آماده توزیع", value: unusedCodes, tone: unusedCodes ? "success" : "neutral" },
          { label: "کد مصرف‌شده", value: redeemedCodes },
          { label: "پاداش منتظر خرید", value: pendingReferralRewards, tone: pendingReferralRewards ? "attention" : "neutral" },
          { label: "Batch", value: batches.size },
        ]}
      />

      <TabNav
        tabs={[
          { href: "/admin/referrals", label: "کدهای فروش", active: activeTab === "codes" },
          { href: "/admin/referrals?tab=referrals", label: "معرفی کاربر به کاربر", active: activeTab === "referrals", count: pendingReferralRewards },
        ]}
      />

      {activeTab === "codes" ? (
        <>
          <Disclosure
            summary={
              <>
                <Ticket className="h-4 w-4 text-slate-400" />
                ساخت batch جدید ({faNum(SALES_CODE_BATCH_SIZE)} کد، هر کد {faNum(creditUnitsToVisibleCredits(SALES_CODE_CREDITS))} اعتبار)
              </>
            }
          >
            <form action={createSalesReferralCodesAction} className="grid max-w-xl gap-3">
              <Field label="نام فروشنده یا کانال">
                <input name="salespersonName" className={fieldClass} />
              </Field>
              {isAdmin ? (
                <Field label="حساب نیروی فروش">
                  <select name="salesUserId" className={fieldClass} defaultValue="">
                    <option value="">بدون مالک حساب</option>
                    {salesUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {getUserDisplayName(user)} · {getUserIdentifier(user)}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
              <Field label="یادداشت داخلی">
                <textarea name="note" className={textareaClass} />
              </Field>
              <div>
                <button className={btnPrimary}>
                  <Ticket className="h-4 w-4" />
                  ساخت {faNum(SALES_CODE_BATCH_SIZE)} کد
                </button>
              </div>
            </form>
          </Disclosure>

          {latestBatches.length === 0 ? (
            <Surface className="p-8">
              <EmptyState title="هنوز batch فروشی ساخته نشده است." />
            </Surface>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {latestBatches.map(([batchKey, batchCodes]) => {
                const redeemed = batchCodes.filter((code) => code.redeemedAt).length;
                const first = batchCodes[0];
                return (
                  <Disclosure
                    key={batchKey}
                    flush
                    summary={
                      <>
                        <span className="truncate font-mono text-xs font-semibold text-navy-950" dir="ltr">
                          {batchKey}
                        </span>
                        <span className="truncate text-xs text-slate-500">
                          {first.salesUser ? getUserDisplayName(first.salesUser) : first.salespersonName || "بدون فروشنده"}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                          {faNum(batchCodes.length - redeemed)} از {faNum(batchCodes.length)} آماده توزیع
                        </span>
                      </>
                    }
                  >
                    <p className="mb-3 truncate text-xs text-slate-500">
                      {formatAdminDate(first.createdAt)} · {getUserDisplayName(first.createdByAdmin)}
                      {first.salesUser ? ` · مالک فروش: ${getUserDisplayName(first.salesUser)}` : ""}
                      {first.note ? ` · ${first.note}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {batchCodes.map((code) => (
                        <span
                          key={code.id}
                          dir="ltr"
                          className={
                            code.redeemedAt
                              ? "rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-400 line-through"
                              : "rounded-md bg-navy-50 px-2 py-1 font-mono text-[11px] font-semibold text-navy-800"
                          }
                        >
                          {code.code}
                        </span>
                      ))}
                    </div>
                  </Disclosure>
                );
              })}
            </div>
          )}

          <Surface>
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-navy-950">آخرین کدها</h2>
            </div>
            <ConsoleTable head={["کد", "فروش", "مصرف‌کننده", "وضعیت", "زمان"]} empty={<EmptyState title="کدی ساخته نشده است." />}>
              {codes.slice(0, 60).map((code) => (
                <tr key={code.id}>
                  <td className={cellClass}>
                    <p className="font-mono text-xs font-semibold" dir="ltr">
                      {code.code}
                    </p>
                    <p className="text-xs text-slate-400">{faNum(creditUnitsToVisibleCredits(code.creditAmount))} اعتبار</p>
                  </td>
                  <td className={cellClass}>
                    <p className="font-medium">{code.salespersonName || "بدون فروشنده"}</p>
                    <p className="max-w-48 truncate text-xs text-slate-400">
                      {code.salesUser ? getUserDisplayName(code.salesUser) : code.note || code.batchKey}
                    </p>
                  </td>
                  <td className={cellClass}>
                    {code.redeemedByUser ? (
                      <Link href={`/admin/users/${code.redeemedByUserId}`} className="font-medium hover:text-navy-700 hover:underline">
                        {getUserDisplayName(code.redeemedByUser)}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">مصرف‌نشده</span>
                    )}
                  </td>
                  <td className={cellClass}>
                    <StatusDot status={code.redeemedAt ? "APPROVED" : "PENDING"} label={code.redeemedAt ? "مصرف‌شده" : "آماده"} />
                  </td>
                  <td className={`${cellClass} text-xs text-slate-500`}>
                    {code.redeemedAt ? formatAdminDate(code.redeemedAt) : formatAdminDate(code.createdAt)}
                  </td>
                </tr>
              ))}
            </ConsoleTable>
          </Surface>
        </>
      ) : (
        <Surface>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-navy-950">معرفی کاربر به کاربر</h2>
          </div>
          <ConsoleTable
            head={["دعوت‌کننده", "دعوت‌شده", "کد", "پاداش", "زمان"]}
            empty={<EmptyState title="هنوز معرفی‌ای ثبت نشده است." />}
          >
            {referrals.map((referral) => (
              <tr key={referral.id}>
                <td className={cellClass}>
                  <Link href={`/admin/users/${referral.inviterId}`} className="font-medium hover:text-navy-700 hover:underline">
                    {getUserDisplayName(referral.inviter)}
                  </Link>
                  <p className="text-xs text-slate-400" dir="ltr">
                    {getUserIdentifier(referral.inviter)}
                  </p>
                </td>
                <td className={cellClass}>
                  <Link href={`/admin/users/${referral.inviteeId}`} className="font-medium hover:text-navy-700 hover:underline">
                    {getUserDisplayName(referral.invitee)}
                  </Link>
                  <p className="text-xs text-slate-400" dir="ltr">
                    {getUserIdentifier(referral.invitee)}
                  </p>
                </td>
                <td className={`${cellClass} font-mono text-xs`} dir="ltr">
                  {referral.codeUsed}
                </td>
                <td className={cellClass}>
                  <p className="tabular-nums">{faNum(creditUnitsToVisibleCredits(referral.rewardCredits))} اعتبار</p>
                  <p className="text-xs text-slate-400">
                    {referral.rewardGrantedAt ? `اعطاشده ${formatAdminDate(referral.rewardGrantedAt)}` : "منتظر اولین خرید"}
                  </p>
                </td>
                <td className={`${cellClass} text-xs text-slate-500`}>{formatAdminDate(referral.createdAt)}</td>
              </tr>
            ))}
          </ConsoleTable>
        </Surface>
      )}
    </>
  );
}
