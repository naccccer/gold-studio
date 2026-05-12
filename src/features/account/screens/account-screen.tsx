import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowLeft2,
  Card,
  Gift,
  Lifebuoy,
  Lock,
  MessageQuestion,
  ReceiptText,
  ShieldSecurity,
  UserEdit,
} from "vuesax-icons-react";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { accountCardClass } from "@/features/account/components/account-subpage";
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
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const rowItems: AccountRowItem[] = [
  { title: "مشخصات حساب", href: "/account/profile", icon: UserEdit },
  { title: "کد معرفی", href: "/account/referral", icon: Gift },
  { title: "امنیت حساب", href: "/account/security", icon: Lock },
];

function AccountRow({ item }: { item: AccountRowItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="grid min-h-[4.4rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-lg)] border border-white/72 bg-surface/64 px-3.5 py-3 text-right font-medium transition hover:border-border-strong hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
      dir="rtl"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
        <Icon aria-hidden={true} className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 text-right">
        <p className="truncate text-sm font-semibold leading-5 text-foreground">{item.title}</p>
      </div>
      <ArrowLeft2 aria-hidden={true} className="h-4 w-4 shrink-0 text-muted-foreground" />
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
}: AccountScreenProps) {
  const isAdmin = role.toUpperCase() === "ADMIN";
  const displayName = getUserDisplayName({ name, email, phone });
  const identifier = getUserIdentifier({ email, phone });
  const pendingReceiptCount = pendingRequests.filter((request) => !request.receiptSubmittedAt).length;
  const nextBillingHref = pendingReceiptCount > 0 ? "/billing?tab=receipts" : pendingRequests.length > 0 ? "/billing?tab=receipts" : "/billing";
  const nextBillingLabel =
    pendingReceiptCount > 0 ? "ارسال رسید پرداخت" : pendingRequests.length > 0 ? "پیگیری وضعیت خرید" : "انتخاب پلن یا اعتبار";

  return (
    <PageShell maxWidth="md" className="space-y-3 pb-32">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-3">
        <section className="rounded-[1.45rem] border border-white/80 bg-surface/62 p-3.5 shadow-[0_22px_50px_-44px_rgba(17,16,14,0.72)]">
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-[1rem] bg-[#e8dfd2]">
                <Image src={archiveItems[1].src} alt="" fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">{displayName}</p>
                <p className="mt-1 truncate text-xs font-medium text-muted" dir="ltr">
                  {identifier}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[1rem] bg-white/62 px-3 py-2.5 text-right">
              <p className="text-[11px] font-medium text-muted">اعتبار</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{credits.toLocaleString("fa-IR")}</p>
            </div>
            <div className="rounded-[1rem] bg-white/62 px-3 py-2.5 text-right">
              <p className="text-[11px] font-medium text-muted">اشتراک</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{subscriptionCredits.toLocaleString("fa-IR")}</p>
            </div>
            <div className="rounded-[1rem] bg-white/62 px-3 py-2.5 text-right">
              <p className="text-[11px] font-medium text-muted">جداگانه</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{walletCredits.toLocaleString("fa-IR")}</p>
            </div>
          </div>
        </section>

        <section className={`${accountCardClass} space-y-3`}>
          {pendingRequests.length > 0 ? (
            <div className="rounded-[1rem] bg-white/62 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ReceiptText aria-hidden={true} className="h-4 w-4 text-accent-deep" />
                  <p className="text-sm font-semibold text-foreground">درخواست‌های باز خرید</p>
                </div>
                <StatusPill variant="accent" className="text-[10px]">
                  {pendingRequests.length.toLocaleString("fa-IR")} مورد
                </StatusPill>
              </div>
              <p className="mt-2 text-xs leading-6 text-muted">{pendingReceiptCount > 0 ? "منتظر رسید" : "در حال بررسی"}</p>
            </div>
          ) : null}
          <ButtonLink href={nextBillingHref} size="full" className="h-12 rounded-[1rem]">
            <Card aria-hidden={true} className="h-4 w-4" />
            {nextBillingLabel}
          </ButtonLink>
        </section>

        <section className="space-y-2.5">
          {rowItems.map((item) => (
            <AccountRow key={item.title} item={item} />
          ))}
        </section>

        {isAdmin ? (
          <section className={`${accountCardClass} space-y-3`}>
            <ButtonLink
              href="/admin"
              variant="primary"
              size="full"
              className="h-12 rounded-[1rem] bg-[#1f1b16] !text-[#fffdf9] hover:bg-[#30291f]"
            >
              <ShieldSecurity aria-hidden={true} className="h-4 w-4" />
              ورود به پنل ادمین
            </ButtonLink>
          </section>
        ) : null}

        <section className={`${accountCardClass} space-y-3`}>
          <div className="grid grid-cols-2 gap-3">
            <ButtonLink
              href="/account/support"
              variant="secondary"
              className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[1rem] border border-border bg-surface px-2 text-xs font-semibold text-foreground shadow-[0_16px_30px_-28px_rgba(17,16,14,0.55)]"
            >
              <Lifebuoy aria-hidden={true} className="h-4 w-4" />
              <span className="truncate">پشتیبانی</span>
            </ButtonLink>
            <ButtonLink
              href="/account/faq"
              variant="secondary"
              className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[1rem] border border-border bg-surface px-2 text-xs font-semibold text-foreground shadow-[0_16px_30px_-28px_rgba(17,16,14,0.55)]"
            >
              <MessageQuestion aria-hidden={true} className="h-4 w-4" />
              <span className="truncate">سوالات پرتکرار</span>
            </ButtonLink>
          </div>
        </section>

        <div className="mt-auto">
          <LogoutButton className="h-12 rounded-[1rem] border-[#e3b8ad] bg-[#fff2ef]/78 text-sm font-semibold text-[#9d3f2f] hover:bg-[#fff2ef]" />
        </div>
      </div>
    </PageShell>
  );
}
