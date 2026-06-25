import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowLeft2,
  Archive,
  ArchiveBook,
  Card,
  Gift,
  Lifebuoy,
  MessageQuestion,
  NotificationBing,
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
import { normalizeBillingPlanColorPreset, type BillingPlanColorPreset } from "@/lib/billing-plan-colors";
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
  pendingRequests: PendingPurchase[];
  activeSubscription: {
    title: string;
    colorPreset: string;
  } | null;
};

type AccountRowItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const rowItems: AccountRowItem[] = [
  { title: "حساب کاربری", href: "/account/profile", icon: UserEdit },
  { title: "گالری نمونه‌ها", href: "/account/style-references", icon: Archive },
  { title: "پیام‌ها", href: "/account/notifications", icon: NotificationBing },
  { title: "آرشیو", href: "/account/archive", icon: ArchiveBook },
  { title: "کد معرفی", href: "/account/referral", icon: Gift },
];

const planBadgeSkins = {
  amber:
    "border-[#f4d69b]/42 bg-[radial-gradient(circle_at_16%_12%,rgba(255,235,178,0.42),transparent_31%),linear-gradient(135deg,#20140f_0%,#4b2b1f_48%,#9b7040_100%)] text-[#fff4d8]",
  rose:
    "border-[#d7c8ff]/38 bg-[radial-gradient(circle_at_18%_10%,rgba(238,220,255,0.42),transparent_30%),linear-gradient(135deg,#15131f_0%,#34264d_48%,#8b6677_100%)] text-[#f5e9ff]",
  emerald:
    "border-[#c7f0e0]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(215,255,236,0.34),transparent_31%),linear-gradient(135deg,#101a17_0%,#16392f_48%,#b09358_100%)] text-[#e8fff4]",
  sapphire:
    "border-[#c8ddff]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(207,226,255,0.38),transparent_31%),linear-gradient(135deg,#101521_0%,#203a5f_50%,#7c6843_100%)] text-[#e8f2ff]",
  plum:
    "border-[#e7c7f0]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(245,215,255,0.34),transparent_31%),linear-gradient(135deg,#18111d_0%,#4c2d59_50%,#9a7250_100%)] text-[#f8e5ff]",
  graphite:
    "border-[#ddd4c8]/30 bg-[radial-gradient(circle_at_18%_10%,rgba(230,222,211,0.3),transparent_31%),linear-gradient(135deg,#11100e_0%,#302b26_50%,#746552_100%)] text-[#f2eadf]",
  bronze:
    "border-[#f1c995]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(255,214,161,0.34),transparent_31%),linear-gradient(135deg,#1f120b_0%,#613a20_50%,#a57842_100%)] text-[#ffe7c6]",
  teal:
    "border-[#bde9e5]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(199,255,250,0.3),transparent_31%),linear-gradient(135deg,#0d1a1a_0%,#164647_50%,#9a7a4d_100%)] text-[#e5fffb]",
  ruby:
    "border-[#f0c1c8]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(255,207,215,0.3),transparent_31%),linear-gradient(135deg,#1f1012_0%,#5f2831_50%,#a07147_100%)] text-[#ffe7eb]",
  ivory:
    "border-[#ead7a8]/40 bg-[radial-gradient(circle_at_18%_10%,rgba(255,241,199,0.48),transparent_31%),linear-gradient(135deg,#231b12_0%,#6d5630_50%,#d6bf91_100%)] text-[#fff4d2]",
} satisfies Record<BillingPlanColorPreset, string>;

function PlanBadge({ title, colorPreset }: { title: string; colorPreset: string }) {
  const skin = planBadgeSkins[normalizeBillingPlanColorPreset(colorPreset)];

  return (
    <Link
      href="/billing"
      aria-label={`اشتراک فعال: ${title}`}
      className={`inline-flex h-9 max-w-[8.5rem] items-center rounded-full border px-3 text-[11px] font-semibold shadow-[0_16px_34px_-24px_rgba(17,16,14,0.78)] transition hover:brightness-110 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] ${skin}`}
    >
      <span className="truncate leading-none">{title}</span>
    </Link>
  );
}

function AccountRow({ item }: { item: AccountRowItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="motion-surface grid min-h-[4.4rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-lg)] border border-white/72 bg-surface/64 px-3.5 py-3 text-right font-medium hover:border-border-strong hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
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
  pendingRequests,
  activeSubscription,
}: AccountScreenProps) {
  const canEnterAdmin = ["ADMIN", "SALES"].includes(role.toUpperCase());
  const displayName = getUserDisplayName({ name, email, phone });
  const identifier = getUserIdentifier({ email, phone });
  const pendingReceiptCount = pendingRequests.filter((request) => !request.receiptSubmittedAt).length;
  const nextBillingHref = pendingReceiptCount > 0 ? "/billing?tab=receipts" : pendingRequests.length > 0 ? "/billing?tab=receipts" : "/billing";
  const nextBillingLabel =
    pendingReceiptCount > 0 ? "ارسال رسید پرداخت" : pendingRequests.length > 0 ? "پیگیری وضعیت خرید" : "انتخاب پلن یا اعتبار";

  return (
    <PageShell maxWidth="md" className="space-y-3 pb-32">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-3">
        <section className="motion-reveal rounded-[1.45rem] border border-white/80 bg-surface/62 p-3.5 shadow-[0_22px_50px_-44px_rgba(17,16,14,0.72)]">
          <div className="flex items-start justify-between gap-3">
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
            {activeSubscription ? (
              <div className="shrink-0 pt-0.5">
                <PlanBadge title={activeSubscription.title} colorPreset={activeSubscription.colorPreset} />
              </div>
            ) : null}
          </div>
        </section>

        <section className={`${accountCardClass} space-y-3`}>
          {pendingRequests.length > 0 ? (
            <div className="motion-state rounded-[1rem] bg-white/62 px-3 py-3">
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

        {canEnterAdmin ? (
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
