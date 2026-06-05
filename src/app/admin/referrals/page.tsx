import { Gift, Ticket } from "vuesax-icons-react";
import {
  adminInputClass,
  adminLabelClass,
  adminPrimaryActionClass,
  adminTextareaClass,
  AdminMetric,
  AdminRow,
  AdminSection,
  EmptyAdminState,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import { CopySalesCodesButton } from "@/features/admin/components/copy-sales-codes-button";
import { createSalesReferralCodesAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { requireAdminSession } from "@/lib/auth/session";
import { SALES_CODE_BATCH_SIZE, SALES_CODE_CREDITS } from "@/lib/credits";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  await requireAdminSession();

  const [codes, totalCodes, redeemedCodes, pendingReferralRewards] = await Promise.all([
    db.salesReferralCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        createdByAdmin: { select: { name: true, email: true, phone: true } },
        redeemedByUser: { select: { name: true, email: true, phone: true } },
      },
    }),
    db.salesReferralCode.count(),
    db.salesReferralCode.count({ where: { redeemedAt: { not: null } } }),
    db.referral.count({ where: { rewardGrantedAt: null } }),
  ]);

  const unusedCodes = totalCodes - redeemedCodes;
  const copyableCodes = codes.filter((code) => !code.redeemedAt).map((code) => code.code);

  return (
    <div className="space-y-5">
      <section className="grid gap-2.5 sm:grid-cols-3">
        <AdminMetric label="کدهای مصرف‌نشده" value={unusedCodes} />
        <AdminMetric label="کدهای مصرف‌شده" value={redeemedCodes} />
        <AdminMetric label="معرف‌های در انتظار خرید" value={pendingReferralRewards} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)] xl:items-start">
        <AdminSection
          title="ساخت کد تست فروش"
          eyebrow={`هر بار ${SALES_CODE_BATCH_SIZE.toLocaleString("fa-IR")} کد یک‌بارمصرف، هر کدام ${SALES_CODE_CREDITS.toLocaleString("fa-IR")} اعتبار`}
          action={<Gift aria-hidden="true" className="h-4 w-4 text-accent-deep" />}
        >
          <form action={createSalesReferralCodesAction} className="space-y-3">
            <label className={adminLabelClass}>
              <span>نام نیروی فروش</span>
              <input name="salespersonName" className={adminInputClass} />
            </label>
            <label className={adminLabelClass}>
              <span>یادداشت</span>
              <textarea name="note" className={adminTextareaClass} />
            </label>
            <button className={adminPrimaryActionClass}>
              <Ticket aria-hidden="true" className="h-3.5 w-3.5" />
              ساخت ۵ کد
            </button>
          </form>
        </AdminSection>

        <AdminSection title="کدهای فروش" eyebrow="آخرین batchها و وضعیت مصرف" action={<CopySalesCodesButton codes={copyableCodes} />}>
          {codes.length === 0 ? (
            <EmptyAdminState>هنوز کدی ساخته نشده است.</EmptyAdminState>
          ) : (
            <div className="space-y-1">
              {codes.map((code) => (
                <AdminRow key={code.id} className="md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div>
                    <p className="font-mono text-sm font-semibold tracking-[0.14em] text-foreground" dir="ltr">
                      {code.code}
                    </p>
                    <p className="mt-1 text-xs text-muted">{code.creditAmount.toLocaleString("fa-IR")} اعتبار</p>
                  </div>
                  <div className="text-xs text-muted">
                    <p className="font-medium text-foreground">{code.salespersonName || "بدون نام فروش"}</p>
                    <p>{code.batchKey}</p>
                    {code.note ? <p className="mt-1 line-clamp-2">{code.note}</p> : null}
                  </div>
                  <div className="text-xs text-muted">
                    <p>سازنده: {getUserDisplayName(code.createdByAdmin)}</p>
                    <p>{formatAdminDate(code.createdAt)}</p>
                    {code.redeemedByUser ? (
                      <p className="mt-1">
                        مصرف‌کننده: {getUserDisplayName(code.redeemedByUser)}{" "}
                        <span dir="ltr">({getUserIdentifier(code.redeemedByUser)})</span>
                      </p>
                    ) : null}
                  </div>
                  <span className={code.redeemedAt ? "text-xs font-semibold text-muted" : "text-xs font-semibold text-accent-deep"}>
                    {code.redeemedAt ? `مصرف‌شده · ${formatAdminDate(code.redeemedAt)}` : "مصرف‌نشده"}
                  </span>
                </AdminRow>
              ))}
            </div>
          )}
        </AdminSection>
      </div>
    </div>
  );
}
