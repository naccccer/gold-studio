import Link from "next/link";
import { Gift, Ticket } from "vuesax-icons-react";
import {
  adminInputClass,
  adminPrimaryActionClass,
  adminTableCellClass,
  adminTextareaClass,
  AdminDataTable,
  AdminEmptyState,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import { createSalesReferralCodesAction } from "@/features/admin/actions";
import { CopySalesCodesButton } from "@/features/admin/components/copy-sales-codes-button";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { SALES_CODE_BATCH_SIZE, SALES_CODE_CREDITS } from "@/lib/credits";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  const [codes, totalCodes, redeemedCodes, pendingReferralRewards, referrals] = await Promise.all([
    db.salesReferralCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        createdByAdmin: { select: { name: true, email: true, phone: true } },
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
      <AdminPageHeader
        title="معرفی و فروش"
        description="کنسول کدهای فروش، referral کاربر به کاربر، وضعیت rewardها و کنترل سریع batchهای قابل توزیع."
        actions={<CopySalesCodesButton codes={copyableCodes} />}
      />

      <AdminKpiStrip>
        <AdminKpi label="کد آماده توزیع" value={unusedCodes} tone={unusedCodes ? "success" : "neutral"} />
        <AdminKpi label="کد مصرف‌شده" value={redeemedCodes} />
        <AdminKpi label="Reward منتظر خرید" value={pendingReferralRewards} tone={pendingReferralRewards ? "attention" : "neutral"} />
        <AdminKpi label="Batch فعال" value={batches.size} />
        <AdminKpi label="Referral اخیر" value={referrals.length} />
      </AdminKpiStrip>

      <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.7fr)_minmax(0,1.3fr)]">
        <AdminPanel
          title="ساخت batch فروش"
          description={`هر batch شامل ${SALES_CODE_BATCH_SIZE.toLocaleString("fa-IR")} کد یک‌بارمصرف است و هر کد ${SALES_CODE_CREDITS.toLocaleString("fa-IR")} اعتبار می‌دهد.`}
        >
          <form action={createSalesReferralCodesAction} className="grid gap-3 p-4">
            <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
              نام فروشنده یا کانال
              <input name="salespersonName" className={adminInputClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
              یادداشت داخلی
              <textarea name="note" className={adminTextareaClass} />
            </label>
            <button className={adminPrimaryActionClass}>
              <Ticket className="h-4 w-4" />
              ساخت {SALES_CODE_BATCH_SIZE.toLocaleString("fa-IR")} کد
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title="Batchهای اخیر" description="نمای عملیاتی برای توزیع، پیگیری مصرف و تشخیص کانال‌های فروش فعال.">
          <div className="divide-y divide-slate-100">
            {latestBatches.length === 0 ? (
              <div className="p-4">
                <AdminEmptyState title="هنوز batch فروشی ساخته نشده است." />
              </div>
            ) : (
              latestBatches.map(([batchKey, batchCodes]) => {
                const redeemed = batchCodes.filter((code) => code.redeemedAt).length;
                const first = batchCodes[0];
                return (
                  <section key={batchKey} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold text-slate-950" dir="ltr">
                          {batchKey}
                        </p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {first.salespersonName || "بدون فروشنده"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatAdminDate(first.createdAt)}، سازنده {getUserDisplayName(first.createdByAdmin)}
                      </p>
                      {first.note ? <p className="mt-1 text-xs leading-6 text-slate-600">{first.note}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {batchCodes.map((code) => (
                          <span
                            key={code.id}
                            className={
                              code.redeemedAt
                                ? "rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-400 line-through"
                                : "rounded-md bg-cyan-50 px-2 py-1 font-mono text-[11px] font-semibold text-cyan-900 ring-1 ring-cyan-100"
                            }
                            dir="ltr"
                          >
                            {code.code}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-950">
                        {redeemed.toLocaleString("fa-IR")} از {batchCodes.length.toLocaleString("fa-IR")} مصرف‌شده
                      </p>
                      <p className="mt-1">{batchCodes[0].creditAmount.toLocaleString("fa-IR")} اعتبار برای هر کد</p>
                      <p className="mt-1">{(batchCodes.length - redeemed).toLocaleString("fa-IR")} کد آماده توزیع</p>
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="کدهای فروش" description="آخرین ۱۲۰ کد ساخته‌شده، همراه با وضعیت مصرف و مالک نهایی.">
        <AdminDataTable
          headers={["کد", "فروش", "سازنده", "مصرف‌کننده", "وضعیت", "زمان"]}
          empty={<AdminEmptyState title="کدی ساخته نشده است." />}
        >
          {codes.map((code) => (
            <tr key={code.id}>
              <td className={adminTableCellClass}>
                <p className="font-mono text-sm font-semibold text-slate-950" dir="ltr">
                  {code.code}
                </p>
                <p className="text-xs text-slate-500">{code.creditAmount.toLocaleString("fa-IR")} اعتبار</p>
              </td>
              <td className={adminTableCellClass}>
                <p className="font-semibold text-slate-950">{code.salespersonName || "بدون فروشنده"}</p>
                <p className="max-w-xs truncate text-xs text-slate-500">{code.note || code.batchKey}</p>
              </td>
              <td className={adminTableCellClass}>{getUserDisplayName(code.createdByAdmin)}</td>
              <td className={adminTableCellClass}>
                {code.redeemedByUser ? (
                  <Link href={`/admin/users/${code.redeemedByUserId}`} className="font-semibold text-slate-950 hover:underline">
                    {getUserDisplayName(code.redeemedByUser)}
                    <p className="text-xs text-slate-500" dir="ltr">
                      {getUserIdentifier(code.redeemedByUser)}
                    </p>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700">
                    <Gift className="h-3.5 w-3.5" />
                    مصرف‌نشده
                  </span>
                )}
              </td>
              <td className={adminTableCellClass}>
                <AdminStatus status={code.redeemedAt ? "APPROVED" : "PENDING"} label={code.redeemedAt ? "مصرف‌شده" : "آماده"} />
              </td>
              <td className={adminTableCellClass}>{code.redeemedAt ? formatAdminDate(code.redeemedAt) : formatAdminDate(code.createdAt)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>

      <AdminPanel title="Referral کاربر به کاربر" description="پاداش‌ها بعد از اولین خرید معتبر قابل پیگیری هستند.">
        <AdminDataTable
          headers={["دعوت‌کننده", "دعوت‌شده", "کد", "Reward", "زمان"]}
          empty={<AdminEmptyState title="هنوز referral ثبت نشده است." />}
        >
          {referrals.map((referral) => (
            <tr key={referral.id}>
              <td className={adminTableCellClass}>
                <Link href={`/admin/users/${referral.inviterId}`} className="font-semibold text-slate-950 hover:underline">
                  {getUserDisplayName(referral.inviter)}
                </Link>
                <p className="text-xs text-slate-500" dir="ltr">
                  {getUserIdentifier(referral.inviter)}
                </p>
              </td>
              <td className={adminTableCellClass}>
                <Link href={`/admin/users/${referral.inviteeId}`} className="font-semibold text-slate-950 hover:underline">
                  {getUserDisplayName(referral.invitee)}
                </Link>
                <p className="text-xs text-slate-500" dir="ltr">
                  {getUserIdentifier(referral.invitee)}
                </p>
              </td>
              <td className={adminTableCellClass} dir="ltr">
                {referral.codeUsed}
              </td>
              <td className={adminTableCellClass}>
                <p>{referral.rewardCredits.toLocaleString("fa-IR")} اعتبار</p>
                <p className="text-xs text-slate-500">
                  {referral.rewardGrantedAt ? `اعطا شده، ${formatAdminDate(referral.rewardGrantedAt)}` : "منتظر اولین خرید"}
                </p>
                {referral.rewardPurchaseRequest ? (
                  <p className="text-xs text-slate-500">خرید مرتبط: {referral.rewardPurchaseRequest.status}</p>
                ) : null}
              </td>
              <td className={adminTableCellClass}>{formatAdminDate(referral.createdAt)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>
    </>
  );
}
