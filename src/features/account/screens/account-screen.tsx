import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, CircleHelp, CreditCard, Gift, LifeBuoy, Lock, ReceiptText, Settings2, Shield, UserRoundCog } from "lucide-react";
import type { ComponentType } from "react";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { archiveItems } from "@/lib/placeholders/jewelry-images";

type PendingPurchase = {
  id: string;
  receiptSubmittedAt: Date | null;
  package: { title: string };
};

type AccountScreenProps = {
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  credits: number;
  walletCredits: number;
  subscriptionCredits: number;
  pendingRequests: PendingPurchase[];
  activeSubscription: {
    title: string;
    creditsPerPeriod: number;
    creditsUsedThisPeriod: number;
    currentPeriodEnd: Date;
  } | null;
};

type AccountRowItem = {
  title: string;
  caption: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const rowItems: AccountRowItem[] = [
  { title: "مشخصات", caption: "نام، موبایل و اطلاعات فروشگاه", href: "/account/profile", icon: UserRoundCog },
  { title: "دریافت کد معرفی", caption: "دعوت همکاران و دریافت اعتبار", href: "/account/referral", icon: Gift },
  { title: "تنظیمات خروجی", caption: "کیفیت، اندازه و مسیر ذخیره", href: "/account/output-settings", icon: Settings2 },
  { title: "امنیت حساب", caption: "رمز عبور و نشست‌ها", href: "/account/security", icon: Lock },
];

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

function AccountRow({ item }: { item: AccountRowItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="grid min-h-[4.15rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.05rem] border border-white/72 bg-surface/64 px-3.5 py-2.5 text-right font-medium transition hover:border-border-strong hover:bg-surface/90 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
      dir="rtl"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#efe2cd] text-[#8b6835]">
        <Icon aria-hidden={true} className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 text-right">
        <p className="truncate text-sm font-semibold leading-5 text-foreground">{item.title}</p>
        <p className="truncate text-[11px] leading-5 text-muted">{item.caption}</p>
      </div>
      <ChevronLeft aria-hidden={true} className="h-4 w-4 shrink-0 text-[#9a8f82]" />
    </Link>
  );
}

export function AccountScreen({
  name,
  email,
  phone,
  role,
  credits,
  walletCredits,
  subscriptionCredits,
  pendingRequests,
  activeSubscription,
}: AccountScreenProps) {
  const isAdmin = role.toUpperCase() === "ADMIN";
  const displayName = getUserDisplayName({ name, email, phone });
  const identifier = getUserIdentifier({ email, phone });
  const remainingSubscriptionCredits = activeSubscription
    ? Math.max(0, activeSubscription.creditsPerPeriod - activeSubscription.creditsUsedThisPeriod)
    : 0;
  const pendingReceiptCount = pendingRequests.filter((request) => !request.receiptSubmittedAt).length;
  const submittedReceiptCount = pendingRequests.length - pendingReceiptCount;

  return (
    <PageShell maxWidth="md" className="space-y-3 pb-3">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-3">
        <section className="rounded-[1.45rem] border border-white/80 bg-surface/62 p-3.5 shadow-[0_22px_50px_-44px_rgba(17,16,14,0.72)]">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-[1.15rem] bg-[#e8dfd2]">
              <Image src={archiveItems[1].src} alt="" fill className="object-cover" sizes="64px" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">{displayName}</p>
              <p className="mt-1 truncate text-xs font-medium text-muted" dir="ltr">
                {identifier}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-[1rem] bg-white/62 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted">اعتبار باقی‌مانده</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{credits.toLocaleString("fa-IR")}</p>
              <p className="mt-0.5 text-[10px] text-muted">قابل استفاده</p>
            </div>
            <div className="rounded-[1rem] bg-white/62 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted">پلن فعلی</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{activeSubscription?.title ?? "استودیو"}</p>
            </div>
          </div>

          {activeSubscription ? (
            <div className="mt-3 rounded-[1rem] bg-white/62 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3 text-xs text-muted">
                <span>اعتبار اشتراک</span>
                <span>
                  {remainingSubscriptionCredits.toLocaleString("fa-IR")} از {activeSubscription.creditsPerPeriod.toLocaleString("fa-IR")}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e3d8c8]">
                <div
                  className="h-full rounded-full bg-[#9b773f]"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        activeSubscription.creditsPerPeriod > 0
                          ? (remainingSubscriptionCredits / activeSubscription.creditsPerPeriod) * 100
                          : 0,
                      ),
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted">پایان دوره: {dateFormatter.format(activeSubscription.currentPeriodEnd)}</p>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-[1rem] bg-white/50 px-3 py-2">
              <p className="text-[10px] text-muted">کیف پول</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{walletCredits.toLocaleString("fa-IR")}</p>
            </div>
            <div className="rounded-[1rem] bg-white/50 px-3 py-2">
              <p className="text-[10px] text-muted">اشتراک</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{subscriptionCredits.toLocaleString("fa-IR")}</p>
            </div>
          </div>

          {isAdmin ? (
            <ButtonLink
              href="/admin"
              size="full"
              className="mt-3 h-12 rounded-[1rem] border border-[#d6c29c] bg-[#1f1b16] text-surface hover:bg-[#30291f]"
            >
              <Shield aria-hidden={true} className="h-4 w-4" />
              ورود به پنل ادمین
            </ButtonLink>
          ) : null}
        </section>

        {pendingRequests.length > 0 ? (
          <section className="rounded-[1.05rem] border border-white/72 bg-surface/64 p-3 text-right">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ReceiptText aria-hidden={true} className="h-4 w-4 text-[#8b6835]" />
                <p className="text-sm font-semibold text-foreground">پرداخت در جریان</p>
              </div>
              <span className="rounded-full bg-[#efe2cd] px-2.5 py-1 text-[10px] font-semibold text-[#806033]">
                {pendingRequests.length.toLocaleString("fa-IR")} درخواست
              </span>
            </div>
            <p className="mt-2 text-xs leading-6 text-muted">
              {pendingReceiptCount > 0
                ? `${pendingReceiptCount.toLocaleString("fa-IR")} رسید هنوز ارسال نشده است.`
                : `${submittedReceiptCount.toLocaleString("fa-IR")} رسید برای بررسی ارسال شده است.`}
            </p>
          </section>
        ) : null}

        <ButtonLink href="/billing" size="full" className="h-12 rounded-[1rem]">
          <CreditCard aria-hidden={true} className="h-4 w-4" />
          خرید اعتبار یا اشتراک
        </ButtonLink>

        <div className="grid grid-cols-2 gap-3">
          <ButtonLink href="/account/support" variant="secondary" className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[1rem] border border-white/72 bg-surface/64 px-2 text-xs font-semibold text-[#554d43]">
            <LifeBuoy aria-hidden={true} className="h-4 w-4" />
            <span className="truncate">پشتیبانی</span>
          </ButtonLink>
          <ButtonLink href="/account/faq" variant="secondary" className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[1rem] border border-white/72 bg-surface/64 px-2 text-xs font-semibold text-[#554d43]">
            <CircleHelp aria-hidden={true} className="h-4 w-4" />
            <span className="truncate">سوالات پرتکرار</span>
          </ButtonLink>
        </div>

        <div className="space-y-2.5">
          {rowItems.map((item) => (
            <AccountRow key={item.title} item={item} />
          ))}
        </div>

        <div className="mt-auto">
          <LogoutButton className="h-12 rounded-[1rem] border-[#e3b8ad] bg-[#fff2ef]/78 text-sm font-semibold text-[#9d3f2f] hover:bg-[#fff2ef]" />
        </div>
      </div>
    </PageShell>
  );
}
