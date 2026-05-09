import Link from "next/link";
import { ArrowRight, CreditCard, Landmark, Layers3, ReceiptText, Upload, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { createPurchaseRequestAction, submitPurchaseReceiptAction } from "@/features/account/actions";

type BillingPackage = {
  id: string;
  type: string;
  title: string;
  description: string;
  priceAmount: number;
  currency: string;
  credits: number;
  periodDays: number | null;
};

type PendingPurchase = {
  id: string;
  packageId: string;
  amount: number;
  currency: string;
  receiptImageUrl: string | null;
  receiptSubmittedAt: Date | null;
  package: { title: string };
};

type PaymentSettings = {
  cardholderName: string;
  cardNumber: string;
  instructions: string | null;
  isActive: boolean;
} | null;

type BillingScreenProps = {
  packages: BillingPackage[];
  pendingRequests: PendingPurchase[];
  paymentSettings: PaymentSettings;
  activeTab: BillingTab;
};

type BillingTab = "packages" | "credits" | "payment" | "receipts";

const tabs: { id: BillingTab; label: string; icon: LucideIcon }[] = [
  { id: "packages", label: "پکیج‌ها", icon: Layers3 },
  { id: "credits", label: "اعتبار", icon: WalletCards },
  { id: "payment", label: "کارت", icon: Landmark },
  { id: "receipts", label: "رسید", icon: ReceiptText },
];

function formatPrice(amount: number, currency: string) {
  return `${amount.toLocaleString("fa-IR")} ${currency === "IRR" ? "ریال" : currency}`;
}

function compactCardNumber(value: string) {
  return value.replaceAll("-", " ").replace(/(\d{4})(?=\d)/g, "$1 ");
}

const subscriptionCardSkins = [
  {
    card: "border-[#f4d69b]/42 bg-[radial-gradient(circle_at_16%_12%,rgba(255,235,178,0.42),transparent_31%),linear-gradient(135deg,#20140f_0%,#4b2b1f_48%,#9b7040_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(83,45,23,0.82)]",
    glow: "bg-[#ffe1a3]/28",
    accent: "text-[#ffe6ae]",
  },
  {
    card: "border-[#d7c8ff]/38 bg-[radial-gradient(circle_at_18%_10%,rgba(238,220,255,0.42),transparent_30%),linear-gradient(135deg,#15131f_0%,#34264d_48%,#8b6677_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(52,38,77,0.86)]",
    glow: "bg-[#eadcff]/24",
    accent: "text-[#efe2ff]",
  },
  {
    card: "border-[#c7f0e0]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(215,255,236,0.34),transparent_31%),linear-gradient(135deg,#101a17_0%,#16392f_48%,#b09358_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(22,57,47,0.86)]",
    glow: "bg-[#d3ffe9]/22",
    accent: "text-[#dfffee]",
  },
];

function subscriptionSkin(index = 0) {
  return subscriptionCardSkins[index % subscriptionCardSkins.length];
}

function SectionHeader({
  icon: Icon,
  title,
  caption,
}: {
  icon: LucideIcon;
  title: string;
  caption: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#efe2cd] text-[#8b6835]">
        <Icon aria-hidden={true} className="h-4 w-4" />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-[11px] leading-5 text-muted">{caption}</p>
      </div>
    </div>
  );
}

function PackageCard({
  billingPackage,
  pending,
  kind,
  index = 0,
}: {
  billingPackage: BillingPackage;
  pending: boolean;
  kind: "subscription" | "credit";
  index?: number;
}) {
  const isSubscription = kind === "subscription";
  const skin = isSubscription ? subscriptionSkin(index) : null;

  return (
    <form
      action={createPurchaseRequestAction}
      className={[
        "relative overflow-hidden rounded-[1.05rem] border p-3 text-right",
        isSubscription ? skin?.card : "border-white/72 bg-surface/64",
      ].join(" ")}
    >
      <input type="hidden" name="packageId" value={billingPackage.id} />
      {isSubscription ? (
        <>
          <span className={`pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full blur-2xl ${skin?.glow}`} />
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/42" />
        </>
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={["text-sm font-semibold", isSubscription ? "text-white" : "text-foreground"].join(" ")}>
            {billingPackage.title}
          </p>
          <p className={["mt-1 text-[11px] leading-5", isSubscription ? "text-white/72" : "text-muted"].join(" ")}>
            {billingPackage.description}
          </p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
            isSubscription ? "border border-white/20 bg-white/14 text-white backdrop-blur" : "bg-[#efe2cd] text-[#806033]",
          ].join(" ")}
        >
          {billingPackage.credits.toLocaleString("fa-IR")} {kind === "subscription" ? "خروجی" : "اعتبار"}
        </span>
      </div>
      <div className={["relative mt-3 flex flex-wrap items-center justify-between gap-2 text-xs", isSubscription ? "text-white/68" : "text-muted"].join(" ")}>
        <span>{kind === "subscription" ? `${(billingPackage.periodDays ?? 30).toLocaleString("fa-IR")} روزه` : "افزایش موجودی"}</span>
        <span className={["font-semibold", isSubscription ? skin?.accent : "text-foreground"].join(" ")}>
          {formatPrice(billingPackage.priceAmount, billingPackage.currency)}
        </span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className={
          isSubscription
            ? [
                "relative mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[0.9rem] text-xs font-semibold transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-60",
                pending
                  ? "border border-white/22 bg-white/10 text-white/78"
                  : "bg-white text-[#1b1713] shadow-[0_18px_30px_-24px_rgba(255,255,255,0.82)] hover:bg-[#fff8ef]",
              ].join(" ")
            : buttonClasses({
                size: "full",
                variant: pending ? "secondary" : "primary",
                className: "mt-3 h-10 rounded-[0.9rem] text-xs",
              })
        }
      >
        <CreditCard aria-hidden={true} className="h-4 w-4" />
        {pending ? "در انتظار ارسال یا تایید رسید" : "ثبت درخواست خرید"}
      </button>
    </form>
  );
}

export function BillingScreen({ packages, pendingRequests, paymentSettings, activeTab }: BillingScreenProps) {
  const pendingPackageIds = pendingRequests.map((request) => request.packageId);
  const subscriptionPackages = packages.filter((item) => item.type === "SUBSCRIPTION");
  const creditPacks = packages.filter((item) => item.type === "CREDIT_PACK");

  return (
    <PageShell maxWidth="md" className="space-y-3 pb-3">
      <header className="rounded-[1.45rem] border border-white/80 bg-surface/62 p-3.5 shadow-[0_22px_50px_-44px_rgba(17,16,14,0.72)]">
        <ButtonLink href="/account" variant="ghost" size="sm" className="h-9 w-fit rounded-full px-2.5">
          <ArrowRight aria-hidden={true} className="h-4 w-4" />
          حساب
        </ButtonLink>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-[#8b6835]">پرداخت و اعتبار</p>
            <h1 className="mt-1 text-xl font-semibold leading-8 text-foreground">خرید اعتبار یا اشتراک</h1>
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#1f1b16] text-surface">
            <WalletCards aria-hidden={true} className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-2 text-xs leading-6 text-muted">
          درخواست خرید را ثبت کنید، مبلغ را کارت‌به‌کارت کنید و رسید را همین‌جا بفرستید.
        </p>
      </header>

      <nav className="grid grid-cols-4 gap-1 rounded-[1.1rem] border border-white/72 bg-surface/64 p-1" aria-label="بخش‌های پرداخت">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          const receiptBadge = tab.id === "receipts" && pendingRequests.length > 0;

          return (
            <Link
              key={tab.id}
              href={`/billing?tab=${tab.id}`}
              className={[
                "relative inline-flex h-11 items-center justify-center gap-1.5 rounded-[0.85rem] text-[11px] font-semibold transition",
                active ? "bg-[#1f1b16] text-surface shadow-[0_14px_24px_-22px_rgba(17,16,14,0.9)]" : "text-muted hover:bg-white/58 hover:text-foreground",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden={true} className="h-3.5 w-3.5" />
              {tab.label}
              {receiptBadge ? <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#c19045]" /> : null}
            </Link>
          );
        })}
      </nav>

      {activeTab === "packages" ? (
        <section className="space-y-2.5">
          <SectionHeader icon={Layers3} title="پکیج‌های ماهانه" caption="برای فروشگاه‌هایی که هر ماه خروجی منظم می‌خواهند." />
          {subscriptionPackages.length > 0 ? (
            subscriptionPackages.map((billingPackage, index) => (
              <PackageCard
                key={billingPackage.id}
                billingPackage={billingPackage}
                kind="subscription"
                index={index}
                pending={pendingPackageIds.includes(billingPackage.id)}
              />
            ))
          ) : (
            <p className="rounded-[1.05rem] border border-white/72 bg-surface/64 p-3 text-xs text-muted">پکیج ماهانه‌ای برای نمایش وجود ندارد.</p>
          )}
        </section>
      ) : null}

      {activeTab === "credits" ? (
        <section className="space-y-2.5">
          <SectionHeader icon={WalletCards} title="اعتبارهای جداگانه" caption="برای افزایش موجودی بدون تغییر اشتراک ماهانه." />
          {creditPacks.length > 0 ? (
            creditPacks.map((billingPackage) => (
              <PackageCard
                key={billingPackage.id}
                billingPackage={billingPackage}
                kind="credit"
                pending={pendingPackageIds.includes(billingPackage.id)}
              />
            ))
          ) : (
            <p className="rounded-[1.05rem] border border-white/72 bg-surface/64 p-3 text-xs text-muted">اعتبار جداگانه‌ای برای نمایش وجود ندارد.</p>
          )}
        </section>
      ) : null}

      {activeTab === "payment" ? (
        <section className="rounded-[1.05rem] border border-white/72 bg-surface/64 p-3 text-right">
          <div className="flex items-center gap-2">
            <Landmark aria-hidden={true} className="h-4 w-4 text-[#8b6835]" />
            <h2 className="text-sm font-semibold text-foreground">اطلاعات کارت‌به‌کارت</h2>
          </div>
          {paymentSettings?.isActive ? (
            <>
              <div className="mt-3 rounded-[0.95rem] bg-white/62 p-3">
                <p className="text-[11px] text-muted">نام صاحب کارت</p>
                <p className="text-sm font-semibold text-foreground">{paymentSettings.cardholderName}</p>
                <p className="mt-2 text-[11px] text-muted">شماره کارت</p>
                <p className="text-left text-lg font-semibold tracking-[0.16em] text-foreground" dir="ltr">
                  {compactCardNumber(paymentSettings.cardNumber)}
                </p>
              </div>
              {paymentSettings.instructions ? <p className="mt-2 text-[11px] leading-5 text-muted">{paymentSettings.instructions}</p> : null}
            </>
          ) : (
            <p className="mt-3 rounded-[0.95rem] bg-white/62 p-3 text-xs leading-6 text-muted">
              اطلاعات پرداخت هنوز فعال نیست. برای خرید، با پشتیبانی هماهنگ کنید.
            </p>
          )}
        </section>
      ) : null}

      {activeTab === "receipts" ? (
        <section className="space-y-2.5">
          <SectionHeader icon={ReceiptText} title="ارسال رسید / وضعیت خرید" caption="درخواست‌های باز و رسیدهای ارسال‌شده اینجا پیگیری می‌شوند." />
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <form key={request.id} action={submitPurchaseReceiptAction} className="rounded-[1.05rem] border border-white/72 bg-surface/64 p-3">
                <input type="hidden" name="requestId" value={request.id} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{request.package.title}</p>
                    <p className="text-[11px] text-muted">{formatPrice(request.amount, request.currency)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#efe2cd] px-2.5 py-1 text-[10px] text-[#806033]">
                    <ReceiptText aria-hidden={true} className="h-3 w-3" />
                    {request.receiptSubmittedAt ? "رسید ارسال شد" : "رسید لازم است"}
                  </span>
                </div>
                {request.receiptImageUrl ? (
                  <a href={request.receiptImageUrl} className="mt-2 block text-xs text-[#7b5d31]" target="_blank" rel="noreferrer">
                    مشاهده رسید ارسال‌شده
                  </a>
                ) : null}
                <input
                  name="receipt"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-3 block w-full rounded-[0.9rem] border border-border bg-white px-3 py-2 text-xs text-muted"
                />
                <input
                  name="receiptNote"
                  placeholder="توضیح اختیاری؛ مثلا ساعت پرداخت یا چهار رقم آخر کارت"
                  className="mt-2 h-10 w-full rounded-[0.9rem] border border-border bg-white px-3 text-xs outline-none"
                />
                <button type="submit" className={buttonClasses({ size: "full", variant: "secondary", className: "mt-2 h-10 rounded-[0.9rem] text-xs" })}>
                  <Upload aria-hidden={true} className="h-4 w-4" />
                  ارسال رسید
                </button>
              </form>
            ))
          ) : (
            <p className="rounded-[1.05rem] border border-white/72 bg-surface/64 p-3 text-xs leading-6 text-muted">
              هنوز درخواست خرید باز ندارید. بعد از ثبت یک پکیج یا اعتبار، فرم ارسال رسید اینجا نمایش داده می‌شود.
            </p>
          )}
        </section>
      ) : null}
    </PageShell>
  );
}
