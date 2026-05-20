import { Gift } from "vuesax-icons-react";
import {
  AccountSubpage,
  accountCardClass,
  accountMutedCardClass,
} from "@/features/account/components/account-subpage";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ensureUserReferralCode } from "@/lib/referrals";

export const dynamic = "force-dynamic";

function toLatinDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = "۰۱۲۳۴۵۶۷۸۹".indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);

    const arabicIndex = "٠١٢٣٤٥٦٧٨٩".indexOf(digit);
    return arabicIndex >= 0 ? String(arabicIndex) : digit;
  });
}

export default async function AccountReferralPage() {
  const session = await requireUserSession();
  const referralCode = await ensureUserReferralCode(session.userId);
  const displayReferralCode = toLatinDigits(referralCode).toLowerCase();
  const [referrals, rewardEvents] = await Promise.all([
    db.referral.findMany({
      where: { inviterId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { invitee: { select: { name: true, email: true, phone: true } } },
    }),
    db.creditEvent.findMany({
      where: { userId: session.userId, source: "REFERRAL" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <AccountSubpage title="کد معرفی">
      <section className={`${accountCardClass} space-y-3 text-center`}>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
            <Gift aria-hidden={true} className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">کد شما</h2>
        </div>
        <p
          className="rounded-[0.95rem] bg-white px-3 py-3 font-mono text-xl font-semibold tracking-[0.18em] text-foreground"
          dir="ltr"
          lang="en"
        >
          {displayReferralCode}
        </p>
      </section>

      <section className={`${accountCardClass} space-y-2.5`}>
        <h2 className="text-sm font-semibold text-foreground">دعوت‌های ثبت‌شده</h2>
        {referrals.length === 0 ? (
          <p className="text-xs leading-6 text-muted">موردی نیست.</p>
        ) : (
          referrals.map((referral) => (
            <div key={referral.id} className={accountMutedCardClass}>
              <p className="text-sm font-semibold text-foreground">{referral.invitee.name || referral.invitee.email || referral.invitee.phone || "کاربر جدید"}</p>
              <p className="mt-1 text-[11px] text-muted">{referral.rewardCredits.toLocaleString("fa-IR")} اعتبار هدیه</p>
            </div>
          ))
        )}
      </section>

      <section className={`${accountCardClass} space-y-2.5`}>
        <h2 className="text-sm font-semibold text-foreground">آخرین پاداش‌ها</h2>
        {rewardEvents.length === 0 ? (
          <p className="text-xs leading-6 text-muted">موردی نیست.</p>
        ) : (
          rewardEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between rounded-[0.95rem] bg-white/62 px-3 py-2.5 text-xs">
              <span className="text-muted">{event.reason}</span>
              <span className="font-semibold text-foreground">{event.delta.toLocaleString("fa-IR")}</span>
            </div>
          ))
        )}
      </section>
    </AccountSubpage>
  );
}
