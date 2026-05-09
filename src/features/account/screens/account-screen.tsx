import Image from "next/image";
import { ChevronLeft, CircleHelp, CreditCard, Gift, LifeBuoy, Lock, ReceiptText, Settings2, Shield, Upload, UserRoundCog } from "lucide-react";
import type { ComponentType } from "react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { createPurchaseRequestAction, submitPurchaseReceiptAction } from "@/features/account/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { archiveItems } from "@/lib/placeholders/jewelry-images";

type AccountPackage = {
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

type AccountScreenProps = {
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  credits: number;
  packages: AccountPackage[];
  pendingRequests: PendingPurchase[];
  paymentSettings: PaymentSettings;
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
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const rowItems: AccountRowItem[] = [
  { title: "مشخصات", caption: "نام، موبایل و اطلاعات فروشگاه", icon: UserRoundCog },
  { title: "دریافت کد معرفی", caption: "دعوت همکاران و دریافت اعتبار", icon: Gift },
  { title: "تنظیمات خروجی", caption: "کیفیت، اندازه و مسیر ذخیره", icon: Settings2 },
  { title: "امنیت حساب", caption: "رمز عبور و نشست‌ها", icon: Lock },
];

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

function AccountRow({ item }: { item: AccountRowItem }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-[1.05rem] border border-white/72 bg-surface/64 px-3.5 py-2.5 text-right"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#efe2cd] text-[#8b6835]">
          <Icon aria-hidden={true} className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-5 text-foreground">{item.title}</p>
          <p className="text-[11px] leading-5 text-muted">{item.caption}</p>
        </div>
      </div>
      <ChevronLeft aria-hidden={true} className="h-4 w-4 text-[#9a8f82]" />
    </button>
  );
}

function formatPrice(amount: number, currency: string) {
  return `${amount.toLocaleString("fa-IR")} ${currency === "IRR" ? "ریال" : currency}`;
}

function compactCardNumber(value: string) {
  return value.replaceAll("-", " ").replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function AccountScreen({
  name,
  email,
  phone,
  role,
  credits,
  packages,
  pendingRequests,
  paymentSettings,
  activeSubscription,
}: AccountScreenProps) {
  const isAdmin = role.toUpperCase() === "ADMIN";
  const displayName = getUserDisplayName({ name, email, phone });
  const identifier = getUserIdentifier({ email, phone });
  const remainingSubscriptionCredits = activeSubscription
    ? Math.max(0, activeSubscription.creditsPerPeriod - activeSubscription.creditsUsedThisPeriod)
    : 0;
  const pendingPackageIds = pendingRequests.map((request) => request.packageId);
  const subscriptionPackages = packages.filter((item) => item.type === "SUBSCRIPTION");
  const creditPacks = packages.filter((item) => item.type === "CREDIT_PACK");

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

        <div className={buttonClasses({ size: "full", className: "h-12 rounded-[1rem]" })}>
          <CreditCard aria-hidden={true} className="h-4 w-4" />
          خرید اعتبار یا اشتراک
        </div>

        {paymentSettings?.isActive ? (
          <section className="rounded-[1.05rem] border border-white/72 bg-surface/64 p-3 text-right">
            <div className="flex items-center gap-2">
              <CreditCard aria-hidden={true} className="h-4 w-4 text-[#8b6835]" />
              <p className="text-sm font-semibold text-foreground">پرداخت کارت‌به‌کارت</p>
            </div>
            <div className="mt-3 rounded-[0.95rem] bg-white/62 p-3">
              <p className="text-[11px] text-muted">نام صاحب کارت</p>
              <p className="text-sm font-semibold text-foreground">{paymentSettings.cardholderName}</p>
              <p className="mt-2 text-[11px] text-muted">شماره کارت</p>
              <p className="text-left text-lg font-semibold tracking-[0.16em] text-foreground" dir="ltr">
                {compactCardNumber(paymentSettings.cardNumber)}
              </p>
            </div>
            {paymentSettings.instructions ? <p className="mt-2 text-[11px] leading-5 text-muted">{paymentSettings.instructions}</p> : null}
          </section>
        ) : null}

        {subscriptionPackages.length > 0 ? (
          <section className="space-y-2.5">
            <p className="px-1 text-sm font-semibold text-foreground">پکیج‌های ماهانه</p>
            {subscriptionPackages.map((billingPackage) => {
              const pending = pendingPackageIds.includes(billingPackage.id);
              return (
                <form key={billingPackage.id} action={createPurchaseRequestAction} className="rounded-[1.05rem] border border-white/72 bg-surface/64 p-3 text-right">
                  <input type="hidden" name="packageId" value={billingPackage.id} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{billingPackage.title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-muted">{billingPackage.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#efe2cd] px-2.5 py-1 text-[10px] font-semibold text-[#806033]">
                      {billingPackage.credits.toLocaleString("fa-IR")} خروجی
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>{billingPackage.periodDays?.toLocaleString("fa-IR") ?? "۳۰"} روزه</span>
                    <span className="font-semibold text-foreground">{formatPrice(billingPackage.priceAmount, billingPackage.currency)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={pending}
                    className={buttonClasses({
                      size: "full",
                      variant: pending ? "secondary" : "primary",
                      className: "mt-3 h-10 rounded-[0.9rem] text-xs",
                    })}
                  >
                    <CreditCard aria-hidden={true} className="h-4 w-4" />
                    {pending ? "در انتظار ارسال یا تایید رسید" : "ثبت درخواست خرید"}
                  </button>
                </form>
              );
            })}
          </section>
        ) : null}

        {creditPacks.length > 0 ? (
          <section className="space-y-2.5">
            <p className="px-1 text-sm font-semibold text-foreground">اعتبارهای جداگانه</p>
            {creditPacks.map((billingPackage) => {
              const pending = pendingPackageIds.includes(billingPackage.id);
              return (
                <form key={billingPackage.id} action={createPurchaseRequestAction} className="rounded-[1.05rem] border border-white/72 bg-surface/64 p-3 text-right">
                  <input type="hidden" name="packageId" value={billingPackage.id} />
                  <p className="text-sm font-semibold text-foreground">{billingPackage.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">{billingPackage.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>{billingPackage.credits.toLocaleString("fa-IR")} اعتبار</span>
                    <span className="font-semibold text-foreground">{formatPrice(billingPackage.priceAmount, billingPackage.currency)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={pending}
                    className={buttonClasses({ size: "full", variant: pending ? "secondary" : "primary", className: "mt-3 h-10 rounded-[0.9rem] text-xs" })}
                  >
                    {pending ? "در انتظار ارسال یا تایید رسید" : "ثبت درخواست خرید"}
                  </button>
                </form>
              );
            })}
          </section>
        ) : null}

        {pendingRequests.length > 0 ? (
          <section className="space-y-2.5">
            <p className="px-1 text-sm font-semibold text-foreground">ارسال رسید</p>
            {pendingRequests.map((request) => (
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
            ))}
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-white/72 bg-surface/64 text-xs font-semibold text-[#554d43]">
            <LifeBuoy aria-hidden={true} className="h-4 w-4" />
            پشتیبانی
          </button>
          <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-white/72 bg-surface/64 text-xs font-semibold text-[#554d43]">
            <CircleHelp aria-hidden={true} className="h-4 w-4" />
            سوالات پرتکرار
          </button>
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
