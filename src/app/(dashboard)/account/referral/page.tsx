import { Gift } from "lucide-react";
import { AccountSubpage, accountCardClass } from "@/features/account/components/account-subpage";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ensureUserReferralCode } from "@/lib/referrals";

export const dynamic = "force-dynamic";

export default async function AccountReferralPage() {
  const session = await requireUserSession();
  const referralCode = await ensureUserReferralCode(session.userId);
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
    <AccountSubpage title="دریافت کد معرفی" caption="با ثبت‌نام هر همکار از کد شما، برای هر دو حساب ۲ اعتبار هدیه ثبت می‌شود.">
      <section className={`${accountCardClass} text-center`}>
        <Gift aria-hidden={true} className="mx-auto h-5 w-5 text-[#8b6835]" />
        <p className="mt-2 text-xs text-muted">کد معرفی شما</p>
        <p className="mt-1 rounded-[0.95rem] bg-white px-3 py-3 text-xl font-semibold tracking-[0.18em] text-foreground" dir="ltr">
          {referralCode}
        </p>
      </section>

      <section className={`${accountCardClass} space-y-2`}>
        <h2 className="text-sm font-semibold text-foreground">دعوت‌های ثبت‌شده</h2>
        {referrals.length === 0 ? (
          <p className="text-xs leading-6 text-muted">هنوز ثبت‌نامی با کد شما انجام نشده است.</p>
        ) : (
          referrals.map((referral) => (
            <div key={referral.id} className="rounded-[0.9rem] bg-white/62 px-3 py-2">
              <p className="text-sm font-semibold text-foreground">{referral.invitee.name || referral.invitee.email || referral.invitee.phone || "کاربر جدید"}</p>
              <p className="text-[11px] text-muted">{referral.rewardCredits.toLocaleString("fa-IR")} اعتبار هدیه</p>
            </div>
          ))
        )}
      </section>

      <section className={`${accountCardClass} space-y-2`}>
        <h2 className="text-sm font-semibold text-foreground">آخرین پاداش‌ها</h2>
        {rewardEvents.length === 0 ? (
          <p className="text-xs leading-6 text-muted">پاداشی برای این حساب ثبت نشده است.</p>
        ) : (
          rewardEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between rounded-[0.9rem] bg-white/62 px-3 py-2 text-xs">
              <span className="text-muted">{event.reason}</span>
              <span className="font-semibold text-foreground">{event.delta.toLocaleString("fa-IR")}</span>
            </div>
          ))
        )}
      </section>
    </AccountSubpage>
  );
}
