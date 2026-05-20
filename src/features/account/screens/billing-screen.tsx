import Link from "next/link";
import { Bank, Card, DocumentUpload, Layer, ReceiptText, TickCircle, Trash, Wallet, type Icon } from "vuesax-icons-react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { fieldControlClassName } from "@/components/ui/field";
import { PageShell } from "@/components/ui/page-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { createPurchaseRequestAction, deletePurchaseRequestAction, submitPurchaseReceiptAction } from "@/features/account/actions";
import { CopyCardNumberButton } from "@/features/account/components/copy-card-number-button";
import { AccountSectionHeader, accountCardClass } from "@/features/account/components/account-subpage";
import { normalizeBillingPlanColorPreset, type BillingPlanColorPreset } from "@/lib/billing-plan-colors";

type BillingPackage = {
  id: string;
  type: string;
  title: string;
  description: string;
  priceAmount: number;
  currency: string;
  credits: number;
  periodDays: number | null;
  colorPreset: string;
};

type PendingPurchase = {
  id: string;
  packageId: string;
  status: string;
  amount: number;
  currency: string;
  receiptImageUrl: string | null;
  receiptSubmittedAt: Date | null;
  updatedAt: Date;
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
  purchaseRequests: PendingPurchase[];
  paymentSettings: PaymentSettings;
  activeTab: BillingTab;
};

type BillingTab = "packages" | "credits" | "payment" | "receipts";

const tabs: { id: BillingTab; label: string; icon: Icon }[] = [
  { id: "packages", label: "پلن‌ها", icon: Layer },
  { id: "credits", label: "اعتبار", icon: Wallet },
  { id: "payment", label: "کارت", icon: Bank },
  { id: "receipts", label: "رسید", icon: ReceiptText },
];

function formatPrice(amount: number, currency: string) {
  return `${amount.toLocaleString("fa-IR")} ${currency === "IRR" ? "ریال" : currency}`;
}

function compactCardNumber(value: string) {
  return value.replaceAll("-", " ").replace(/(\d{4})(?=\d)/g, "$1 ");
}

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

function purchaseStatusCopy(request: PendingPurchase) {
  if (request.status === "APPROVED") {
    return { label: "تایید شده", detail: "اعتبار یا اشتراک روی حساب فعال شده است.", variant: "completed" as const };
  }

  if (request.status === "REJECTED") {
    return { label: "نیاز به پیگیری", detail: "درخواست تایید نشده؛ برای بررسی بیشتر به پشتیبانی پیام بدهید.", variant: "failed" as const };
  }

  if (request.receiptSubmittedAt) {
    return { label: "در حال بررسی", detail: "رسید ارسال شده و پس از تایید، اعتبار روی حساب می‌نشیند.", variant: "accent" as const };
  }

  return { label: "منتظر رسید", detail: "بعد از کارت‌به‌کارت، تصویر رسید را در همین بخش ارسال کنید.", variant: "accent" as const };
}

const subscriptionCardSkins = {
  amber: {
    card: "border-[#f4d69b]/42 bg-[radial-gradient(circle_at_16%_12%,rgba(255,235,178,0.42),transparent_31%),linear-gradient(135deg,#20140f_0%,#4b2b1f_48%,#9b7040_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(83,45,23,0.82)]",
    glow: "bg-[#ffe1a3]/28",
    accent: "text-[#ffe6ae]",
  },
  rose: {
    card: "border-[#d7c8ff]/38 bg-[radial-gradient(circle_at_18%_10%,rgba(238,220,255,0.42),transparent_30%),linear-gradient(135deg,#15131f_0%,#34264d_48%,#8b6677_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(52,38,77,0.86)]",
    glow: "bg-[#eadcff]/24",
    accent: "text-[#efe2ff]",
  },
  emerald: {
    card: "border-[#c7f0e0]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(215,255,236,0.34),transparent_31%),linear-gradient(135deg,#101a17_0%,#16392f_48%,#b09358_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(22,57,47,0.86)]",
    glow: "bg-[#d3ffe9]/22",
    accent: "text-[#dfffee]",
  },
  sapphire: {
    card: "border-[#c8ddff]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(207,226,255,0.38),transparent_31%),linear-gradient(135deg,#101521_0%,#203a5f_50%,#7c6843_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(32,58,95,0.86)]",
    glow: "bg-[#d7e7ff]/22",
    accent: "text-[#dceaff]",
  },
  plum: {
    card: "border-[#e7c7f0]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(245,215,255,0.34),transparent_31%),linear-gradient(135deg,#18111d_0%,#4c2d59_50%,#9a7250_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(76,45,89,0.86)]",
    glow: "bg-[#f1d7ff]/22",
    accent: "text-[#f4dcff]",
  },
  graphite: {
    card: "border-[#ddd4c8]/30 bg-[radial-gradient(circle_at_18%_10%,rgba(230,222,211,0.3),transparent_31%),linear-gradient(135deg,#11100e_0%,#302b26_50%,#746552_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(17,16,14,0.9)]",
    glow: "bg-[#e7ded2]/18",
    accent: "text-[#efe5d7]",
  },
  bronze: {
    card: "border-[#f1c995]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(255,214,161,0.34),transparent_31%),linear-gradient(135deg,#1f120b_0%,#613a20_50%,#a57842_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(97,58,32,0.86)]",
    glow: "bg-[#ffd8a1]/22",
    accent: "text-[#ffe0b1]",
  },
  teal: {
    card: "border-[#bde9e5]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(199,255,250,0.3),transparent_31%),linear-gradient(135deg,#0d1a1a_0%,#164647_50%,#9a7a4d_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(22,70,71,0.86)]",
    glow: "bg-[#cbfff8]/20",
    accent: "text-[#ddfffb]",
  },
  ruby: {
    card: "border-[#f0c1c8]/34 bg-[radial-gradient(circle_at_18%_10%,rgba(255,207,215,0.3),transparent_31%),linear-gradient(135deg,#1f1012_0%,#5f2831_50%,#a07147_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(95,40,49,0.86)]",
    glow: "bg-[#ffd0d8]/20",
    accent: "text-[#ffdde2]",
  },
  ivory: {
    card: "border-[#ead7a8]/40 bg-[radial-gradient(circle_at_18%_10%,rgba(255,241,199,0.48),transparent_31%),linear-gradient(135deg,#231b12_0%,#6d5630_50%,#d6bf91_100%)] text-surface shadow-[0_24px_56px_-36px_rgba(109,86,48,0.82)]",
    glow: "bg-[#fff0c0]/26",
    accent: "text-[#fff1c7]",
  },
} satisfies Record<BillingPlanColorPreset, { card: string; glow: string; accent: string }>;

function subscriptionSkin(colorPreset?: string | null) {
  return subscriptionCardSkins[normalizeBillingPlanColorPreset(colorPreset)];
}

function PackageCard({
  billingPackage,
  pendingRequest,
  kind,
}: {
  billingPackage: BillingPackage;
  pendingRequest?: PendingPurchase;
  kind: "subscription" | "credit";
}) {
  const isSubscription = kind === "subscription";
  const skin = isSubscription ? subscriptionSkin(billingPackage.colorPreset) : null;
  const pending = Boolean(pendingRequest);

  return (
    <form
      action={createPurchaseRequestAction}
      className={[
        "motion-surface motion-reveal-soft relative overflow-hidden rounded-[1.05rem] border p-3.5 text-right",
        isSubscription ? skin?.card : "border-white/72 bg-surface/64 shadow-[0_18px_42px_-42px_rgba(17,16,14,0.7)]",
      ].join(" ")}
    >
      <input type="hidden" name="packageId" value={billingPackage.id} />
      {pendingRequest ? <input type="hidden" name="requestId" value={pendingRequest.id} /> : null}
      {isSubscription ? (
        <>
          <span className={`pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full blur-2xl ${skin?.glow}`} />
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/42" />
        </>
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={["text-sm font-semibold", isSubscription ? "text-white" : "text-foreground"].join(" ")}>{billingPackage.title}</p>
          <p className={["mt-1 text-[11px] leading-5", isSubscription ? "text-white/72" : "text-muted"].join(" ")}>{billingPackage.description}</p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
            isSubscription ? "border border-white/20 bg-white/14 text-white backdrop-blur" : "border border-accent-soft bg-accent-wash text-accent-deep",
          ].join(" ")}
        >
          {billingPackage.credits.toLocaleString("fa-IR")} {kind === "subscription" ? "خروجی" : "اعتبار"}
        </span>
      </div>
      <div className={["relative mt-3 flex flex-wrap items-center justify-between gap-2 text-xs", isSubscription ? "text-white/68" : "text-muted"].join(" ")}>
        <span>{kind === "subscription" ? `${(billingPackage.periodDays ?? 30).toLocaleString("fa-IR")} روزه` : "افزایش موجودی حساب"}</span>
        <span className={["font-semibold", isSubscription ? skin?.accent : "text-foreground"].join(" ")}>
          {formatPrice(billingPackage.priceAmount, billingPackage.currency)}
        </span>
      </div>
      {pending ? (
        <div className="relative mt-3 grid gap-2">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2">
            <ButtonLink href="/billing?tab=payment" variant={isSubscription ? "studio-secondary" : "primary"} size="full" className="h-10 rounded-[0.9rem] px-2 text-xs">
              <Bank aria-hidden={true} className="h-4 w-4" />
              اطلاعات پرداخت
            </ButtonLink>
            <ButtonLink href="/billing?tab=receipts" variant={isSubscription ? "studio-secondary" : "secondary"} size="full" className="h-10 rounded-[0.9rem] px-2 text-xs">
              <DocumentUpload aria-hidden={true} className="h-4 w-4" />
              بارگذاری رسید
            </ButtonLink>
            <button
              type="submit"
              formAction={deletePurchaseRequestAction}
              className={[
                "motion-press inline-flex h-10 w-10 items-center justify-center rounded-[0.9rem] text-xs shadow-[0_12px_24px_-20px_rgba(17,16,14,0.68)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                isSubscription
                  ? "bg-white/12 text-white/82 hover:bg-white/18"
                  : "bg-danger-soft text-danger hover:bg-[#efd5d0]",
              ].join(" ")}
              aria-label="حذف درخواست خرید"
              title="حذف درخواست"
            >
              <Trash aria-hidden={true} className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          className={
            isSubscription
              ? [
                  "motion-press relative mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[0.9rem] border border-white bg-white text-xs font-semibold text-[#1b1713] shadow-[0_18px_30px_-22px_rgba(255,255,255,0.9)] hover:bg-[#fff8ef] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                ].join(" ")
              : buttonClasses({
                  size: "full",
                  variant: "primary",
                  className: "mt-3 h-10 rounded-[0.9rem] text-xs",
                })
          }
        >
          <Card aria-hidden={true} className="h-4 w-4" />
          {isSubscription ? "انتخاب اشتراک" : "خرید اعتبار"}
        </button>
      )}
    </form>
  );
}

export function BillingScreen({ packages, purchaseRequests, paymentSettings, activeTab }: BillingScreenProps) {
  const pendingRequests = purchaseRequests.filter((request) => request.status === "PENDING");
  const pendingRequestsByPackageId = new Map(pendingRequests.map((request) => [request.packageId, request]));
  const subscriptionPackages = packages.filter((item) => item.type === "SUBSCRIPTION");
  const creditPacks = packages.filter((item) => item.type === "CREDIT_PACK");
  const subscriptionSkinByPackageId = new Map(subscriptionPackages.map((item) => [item.id, subscriptionSkin(item.colorPreset)]));

  return (
    <PageShell maxWidth="md" className="space-y-3 pb-32">
      <nav className="motion-reveal-soft grid grid-cols-4 gap-1 rounded-[1.1rem] border border-white/72 bg-surface/64 p-1" aria-label="بخش‌های پرداخت">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          const receiptBadge = tab.id === "receipts" && pendingRequests.length > 0;

          return (
            <Link
              key={tab.id}
              href={`/billing?tab=${tab.id}`}
              className={[
                "motion-nav-item relative inline-flex h-11 items-center justify-center gap-1.5 rounded-[0.85rem] text-[11px] font-semibold",
                active ? "bg-foreground text-surface shadow-[0_14px_24px_-22px_rgba(17,16,14,0.9)]" : "text-muted hover:bg-white/58 hover:text-foreground",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden={true} className="h-3.5 w-3.5" />
              {tab.label}
              {receiptBadge ? <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent-bright" /> : null}
            </Link>
          );
        })}
      </nav>

      {activeTab === "packages" ? (
        <section className="space-y-2.5">
          <AccountSectionHeader icon={Layer} title="پلن‌های ماهانه" />
          {subscriptionPackages.length > 0 ? (
            subscriptionPackages.map((billingPackage) => (
              <PackageCard
                key={billingPackage.id}
                billingPackage={billingPackage}
                kind="subscription"
                pendingRequest={pendingRequestsByPackageId.get(billingPackage.id)}
              />
            ))
          ) : (
            <p className={`${accountCardClass} text-xs leading-6 text-muted`}>موردی نیست.</p>
          )}
        </section>
      ) : null}

      {activeTab === "credits" ? (
        <section className="space-y-2.5">
          <AccountSectionHeader icon={Wallet} title="اعتبارهای جداگانه" />
          {creditPacks.length > 0 ? (
            creditPacks.map((billingPackage) => (
              <PackageCard
                key={billingPackage.id}
                billingPackage={billingPackage}
                kind="credit"
                pendingRequest={pendingRequestsByPackageId.get(billingPackage.id)}
              />
            ))
          ) : (
            <p className={`${accountCardClass} text-xs leading-6 text-muted`}>موردی نیست.</p>
          )}
        </section>
      ) : null}

      {activeTab === "payment" ? (
        <section className={`${accountCardClass} space-y-3`}>
          <AccountSectionHeader icon={Bank} title="اطلاعات کارت‌به‌کارت" />
          {paymentSettings?.isActive ? (
            <>
              <div className="motion-state rounded-[1rem] bg-white/62 p-3">
                <div className="motion-state rounded-[0.95rem] bg-white/78 px-3 py-2.5">
                  <p className="text-[11px] text-muted">نام صاحب کارت</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{paymentSettings.cardholderName}</p>
                </div>
                <div className="motion-state mt-2 rounded-[0.95rem] bg-white/78 px-3 py-2.5">
                  <p className="text-[11px] text-muted">شماره کارت</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <CopyCardNumberButton cardNumber={paymentSettings.cardNumber} />
                    <p className="min-w-0 text-left text-lg font-semibold tracking-[0.16em] text-foreground" dir="ltr">
                      {compactCardNumber(paymentSettings.cardNumber)}
                    </p>
                  </div>
                </div>
              </div>
              <ButtonLink href="/billing?tab=receipts" variant="primary" size="full" className="h-11 rounded-[0.95rem] px-2 text-xs">
                <DocumentUpload aria-hidden={true} className="h-4 w-4" />
                رفتن به ارسال رسید
              </ButtonLink>
            </>
          ) : (
            <p className="motion-state rounded-[1rem] bg-white/62 p-3 text-xs leading-6 text-muted">
              پرداخت کارت‌به‌کارت فعلا فعال نیست. برای ثبت خرید، از پشتیبانی راهنمایی بگیرید.
            </p>
          )}
        </section>
      ) : null}

      {activeTab === "receipts" ? (
        <section className="space-y-2.5">
          <AccountSectionHeader icon={ReceiptText} title="رسید و وضعیت خرید" />
          {purchaseRequests.length > 0 ? (
            purchaseRequests.map((request) => {
              const status = purchaseStatusCopy(request);
              const canUploadReceipt = request.status === "PENDING";
              const requestSkin = subscriptionSkinByPackageId.get(request.packageId);
              const isPlanRequest = Boolean(requestSkin);

              return (
                <form
                  key={request.id}
                  action={submitPurchaseReceiptAction}
                  className={[
                    "motion-surface motion-reveal-soft relative overflow-hidden rounded-[1.05rem] border p-3.5 text-right",
                    isPlanRequest
                      ? `${requestSkin?.card} space-y-3`
                      : "space-y-3 border-white/72 bg-surface/64 shadow-[0_18px_42px_-42px_rgba(17,16,14,0.7)]",
                  ].join(" ")}
                >
                <input type="hidden" name="requestId" value={request.id} />
                {isPlanRequest ? (
                  <>
                    <span className={`pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full blur-2xl ${requestSkin?.glow}`} />
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/42" />
                  </>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={["relative text-sm font-semibold", isPlanRequest ? "text-white" : "text-foreground"].join(" ")}>{request.package.title}</p>
                    <p className={["relative mt-1 text-[11px]", isPlanRequest ? "text-white/68" : "text-muted"].join(" ")}>
                      {formatPrice(request.amount, request.currency)} · {dateFormatter.format(request.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill variant={status.variant} className="text-[10px]">
                      {request.status === "APPROVED" ? (
                        <TickCircle aria-hidden={true} className="h-3 w-3" />
                      ) : (
                        <ReceiptText aria-hidden={true} className="h-3 w-3" />
                      )}
                      {status.label}
                    </StatusPill>
                    {request.status !== "APPROVED" ? (
                      <button
                        type="submit"
                        formAction={deletePurchaseRequestAction}
                        className="motion-press inline-flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft text-danger shadow-[0_12px_24px_-20px_rgba(152,59,52,0.65)] hover:bg-[#efd5d0] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                        aria-label="حذف از لیست"
                        title="حذف"
                      >
                        <Trash aria-hidden={true} className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
                {request.status !== "APPROVED" ? (
                  <p
                    className={[
                      "relative rounded-[0.95rem] px-3 py-2.5 text-xs leading-6",
                      isPlanRequest ? "bg-white/12 text-white/76" : "bg-white/56 text-muted",
                    ].join(" ")}
                  >
                    {status.detail}
                  </p>
                ) : null}

                {request.receiptImageUrl ? (
                  <a
                    href={request.receiptImageUrl}
                    className={["relative block text-xs font-medium", isPlanRequest ? requestSkin?.accent : "text-[#7b5d31]"].join(" ")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    مشاهده رسید ارسال‌شده
                  </a>
                ) : null}

                {canUploadReceipt ? (
                  <>
                    <div className="space-y-2">
                      <input
                        name="receipt"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className={`${fieldControlClassName} block py-2 text-xs text-muted file:ml-3 file:rounded-full file:border-0 file:bg-accent-wash file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent-deep`}
                      />
                      <input name="receiptNote" placeholder="یادداشت اختیاری" className={`${fieldControlClassName} text-xs`} />
                    </div>

                    <button
                      type="submit"
                      className={
                        isPlanRequest
                          ? "motion-press relative inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-[0.9rem] bg-white px-5 text-xs font-semibold leading-none text-[#1b1713] shadow-[0_18px_30px_-24px_rgba(255,255,255,0.82)] hover:bg-[#fff8ef] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                          : buttonClasses({ size: "full", variant: "primary", className: "h-10 rounded-[0.9rem] text-xs" })
                      }
                    >
                      <DocumentUpload aria-hidden={true} className="h-4 w-4" />
                      {request.receiptSubmittedAt ? "ارسال دوباره رسید" : "ارسال رسید"}
                    </button>
                  </>
                ) : null}
                </form>
              );
            })
          ) : (
            <p className={`${accountCardClass} text-xs leading-6 text-muted`}>
              هنوز خریدی ثبت نشده است. از پلن‌های ماهانه یا اعتبار جداگانه شروع کنید.
            </p>
          )}
        </section>
      ) : null}
    </PageShell>
  );
}
