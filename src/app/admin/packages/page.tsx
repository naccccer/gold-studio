import Link from "next/link";
import {
  Copy,
  Eye,
  EyeSlash,
  Gallery,
  Add,
  BoxAdd,
  Card,
  Layer,
  ReceiptText,
  Save2,
  ShieldTick,
  TickCircle,
  Trash,
  Wallet,
} from "vuesax-icons-react";
import { Button } from "@/components/ui/button";
import {
  adminCompactInputClass,
  adminDangerActionClass,
  adminInputClass,
  adminLabelClass,
  adminPrimaryActionClass,
  adminSecondaryActionClass,
  adminTextareaClass,
  EmptyAdminState,
  formatAdminDate,
  formatIrr,
} from "@/features/admin/components/admin-ui";
import { PriceAmountInput } from "@/features/admin/components/price-amount-input";
import {
  approvePurchaseRequestAction,
  createBillingPackageAction,
  deleteBillingPackageAction,
  duplicateBillingPackageAction,
  rejectPurchaseRequestAction,
  updateBillingPackageAction,
  updatePaymentSettingsAction,
} from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { BILLING_PLAN_COLOR_PRESETS, normalizeBillingPlanColorPreset } from "@/lib/billing-plan-colors";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type PackageWithCounts = Awaited<ReturnType<typeof getPackages>>[number];
type PendingPurchase = Awaited<ReturnType<typeof getPendingPurchases>>[number];

const inputClass = adminInputClass;
const compactInputClass = adminCompactInputClass;
const textareaClass = adminTextareaClass;
const labelClass = adminLabelClass;
const labelTextClass = "text-[11px] font-semibold text-muted";

function cardNumberPreview(cardNumber?: string | null) {
  const digits = (cardNumber ?? "").replace(/\D/g, "");
  if (!digits) return "---- ---- ---- ----";
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function ToggleLine({
  name = "isActive",
  defaultChecked,
  label,
}: {
  name?: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs font-medium text-muted">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-accent" />
      {label}
    </label>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-sm)] border border-border bg-surface-soft/65 px-2.5 py-1.5">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="truncate text-sm font-semibold leading-6 text-foreground">
        {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
      </p>
    </div>
  );
}

function ColorPresetPicker({ defaultValue = "amber" }: { defaultValue?: string | null }) {
  const normalized = normalizeBillingPlanColorPreset(defaultValue);

  return (
    <fieldset className="space-y-1.5">
      <legend className={labelTextClass}>رنگ پلن</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {BILLING_PLAN_COLOR_PRESETS.map((preset) => (
          <label
            key={preset.id}
            className="group relative flex h-8 cursor-pointer items-center justify-center rounded-full bg-surface-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
            title={preset.label}
          >
            <input name="colorPreset" type="radio" value={preset.id} defaultChecked={preset.id === normalized} className="peer sr-only" />
            <span className="h-5 w-5 rounded-full shadow-[0_8px_14px_-10px_rgba(17,16,14,0.9)]" style={{ backgroundColor: preset.swatch }} />
            <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-transparent transition peer-checked:ring-foreground/80" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  eyebrow,
}: {
  icon: typeof Layer;
  title: string;
  eyebrow: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-3">
      <div>
        <p className="text-[11px] font-semibold text-accent-deep">{eyebrow}</p>
        <h2 className="mt-1 text-base font-semibold text-foreground">{title}</h2>
      </div>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border-strong bg-foreground text-accent-bright">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
    </div>
  );
}

function PackageCreateForm({
  type,
  defaultSortOrder,
}: {
  type: "SUBSCRIPTION" | "CREDIT_PACK";
  defaultSortOrder: number;
}) {
  const isSubscription = type === "SUBSCRIPTION";

  return (
    <form action={createBillingPackageAction} className="border-t border-border/70 pt-4">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="currency" value="IRR" />
      <input type="hidden" name="sortOrder" value={defaultSortOrder} />

      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Add aria-hidden="true" className="h-4 w-4 text-accent-deep" />
        {isSubscription ? "افزودن پکیج ماهانه" : "افزودن اعتبار جداگانه"}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_120px_150px_110px_148px_auto] lg:items-end">
        <label className={labelClass}>
          <span className={labelTextClass}>نام نمایشی</span>
          <input name="title" placeholder={isSubscription ? "مثلا استارتر" : "مثلا ۱۰ اعتبار اضافه"} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>توضیح کوتاه برای کاربر</span>
          <input name="description" placeholder="متن کوتاه در حساب کاربر" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>{isSubscription ? "خروجی ماهانه" : "اعتبار"}</span>
          <input name="credits" type="number" min={0} placeholder={isSubscription ? "۲۰" : "۱۰"} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>قیمت ریالی</span>
          <PriceAmountInput placeholder="۵۹٬۰۰۰٬۰۰۰" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>دوره</span>
          <input
            name="periodDays"
            type="number"
            min={1}
            defaultValue={isSubscription ? 30 : 1}
            disabled={!isSubscription}
            className={`${inputClass} disabled:bg-surface-muted disabled:text-muted`}
          />
        </label>
        <ColorPresetPicker />
        <Button type="submit" size="sm" className="h-9 rounded-[var(--radius-sm)]">
          <BoxAdd className="h-4 w-4" />
          ساخت
        </Button>
      </div>

      <div className="mt-3">
        <ToggleLine defaultChecked label="فعال و قابل نمایش در حساب کاربر" />
      </div>
    </form>
  );
}

function PackageRecord({
  billingPackage,
  secondary = false,
}: {
  billingPackage: PackageWithCounts;
  secondary?: boolean;
}) {
  const isSubscription = billingPackage.type === "SUBSCRIPTION";
  const activeLabel = billingPackage.isActive ? "فعال" : "پنهان";
  const ActiveIcon = billingPackage.isActive ? Eye : EyeSlash;
  const usageCount = isSubscription ? billingPackage._count.subscriptions : billingPackage._count.creditEvents;

  return (
    <form
      action={updateBillingPackageAction}
      className={[
        "rounded-[var(--radius-md)] border border-border/80 bg-surface p-2.5 shadow-[var(--shadow-soft)]",
        secondary ? "opacity-[0.96]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input type="hidden" name="packageId" value={billingPackage.id} />
      <input type="hidden" name="type" value={billingPackage.type} />
      <input type="hidden" name="currency" value={billingPackage.currency} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_164px] xl:items-stretch">
        <div className="min-w-0">
          <div className="grid gap-2 border-b border-border/60 pb-2.5 lg:grid-cols-[minmax(180px,1fr)_126px_104px_130px_104px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-foreground text-accent-bright">
                  <ActiveIcon aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-accent-deep">{isSubscription ? "پکیج ماهانه" : "اعتبار جداگانه"}</p>
                  <h3 className="truncate text-base font-semibold leading-7 text-foreground">{billingPackage.title}</h3>
                </div>
              </div>
            </div>
            <StatCell label="وضعیت" value={activeLabel} />
            <StatCell label={isSubscription ? "خروجی" : "اعتبار"} value={billingPackage.credits} />
            <StatCell label="قیمت" value={formatIrr(billingPackage.priceAmount, billingPackage.currency)} />
            <StatCell label="خرید/استفاده" value={`${billingPackage._count.purchaseRequests.toLocaleString("fa-IR")} / ${usageCount.toLocaleString("fa-IR")}`} />
          </div>

          <div className="mt-2.5 grid gap-2 lg:grid-cols-[minmax(130px,0.9fr)_minmax(220px,1.6fr)_96px_132px_88px_88px_148px] lg:items-end">
            <label className={labelClass}>
              <span className={labelTextClass}>نام</span>
              <input name="title" defaultValue={billingPackage.title} className={compactInputClass} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>توضیح</span>
              <input name="description" defaultValue={billingPackage.description} className={compactInputClass} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>{isSubscription ? "خروجی" : "اعتبار"}</span>
              <input name="credits" type="number" min={0} defaultValue={billingPackage.credits} className={compactInputClass} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>قیمت</span>
              <PriceAmountInput defaultValue={billingPackage.priceAmount} className={compactInputClass} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>دوره</span>
              <input
                name="periodDays"
                type="number"
                min={1}
                defaultValue={billingPackage.periodDays ?? 30}
                disabled={!isSubscription}
                className={`${compactInputClass} disabled:bg-surface-muted disabled:text-muted`}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>ترتیب</span>
              <input name="sortOrder" type="number" defaultValue={billingPackage.sortOrder} className={compactInputClass} />
            </label>
            <ColorPresetPicker defaultValue={billingPackage.colorPreset} />
          </div>
        </div>

        <div className="grid gap-2 border-t border-border/60 pt-2.5 sm:grid-cols-4 xl:flex xl:flex-col xl:border-r xl:border-t-0 xl:pr-2.5 xl:pt-0">
          <ToggleLine defaultChecked={billingPackage.isActive} label="فعال" />
          <Button type="submit" size="sm" className="h-9 rounded-[var(--radius-sm)] xl:w-full">
            <Save2 className="h-4 w-4" />
            ذخیره
          </Button>
          <button
            formAction={duplicateBillingPackageAction}
            className={`${adminSecondaryActionClass} xl:w-full`}
          >
            <Copy className="h-3.5 w-3.5" />
            کپی
          </button>
          <button
            formAction={deleteBillingPackageAction}
            className={`${adminDangerActionClass} xl:mt-auto xl:w-full`}
          >
            <Trash className="h-3.5 w-3.5" />
            حذف
          </button>
        </div>
      </div>
    </form>
  );
}

function PendingReceipts({ pendingPurchases, pendingCount }: { pendingPurchases: PendingPurchase[]; pendingCount: number }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border/80 bg-surface shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-foreground text-accent-bright">
            <ReceiptText aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">بررسی رسیدهای خرید</h2>
            <p className="text-xs text-muted">تایید رسید، اشتراک یا اعتبار را برای کاربر فعال می‌کند.</p>
          </div>
        </div>
        <Link
          href="/admin/users"
          className={adminSecondaryActionClass}
        >
          مشاهده کاربران
        </Link>
      </div>

      {pendingPurchases.length === 0 ? (
        <div className="px-4 py-4">
          <EmptyAdminState>درخواست خرید در انتظار تایید نیست.</EmptyAdminState>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {pendingPurchases.map((request) => (
            <div key={request.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{request.package.title}</p>
                <p className="truncate text-xs text-muted">
                  {getUserDisplayName(request.user)} · {getUserIdentifier(request.user)}
                </p>
              </div>
              <div className="text-xs text-muted">
                <p>{formatIrr(request.amount, request.currency)} · {formatAdminDate(request.createdAt)}</p>
                {request.receiptImageUrl ? (
                  <a href={request.receiptImageUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-accent-deep">
                    <Gallery className="h-3.5 w-3.5" />
                    مشاهده رسید
                  </a>
                ) : (
                  <p className="mt-1 text-danger">رسید هنوز ارسال نشده است.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={approvePurchaseRequestAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <button className={adminPrimaryActionClass}>
                    <TickCircle className="h-3.5 w-3.5" />
                    تایید
                  </button>
                </form>
                <form action={rejectPurchaseRequestAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <button className={adminDangerActionClass}>
                    رد
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
      {pendingCount > pendingPurchases.length ? (
        <p className="border-t border-border/60 px-4 py-3 text-xs text-muted">
          {pendingCount.toLocaleString("fa-IR")} رسید در انتظار است؛ آخرین {pendingPurchases.length.toLocaleString("fa-IR")} مورد نمایش داده شد.
        </p>
      ) : null}
    </section>
  );
}

async function getPackages() {
  return db.billingPackage.findMany({
    where: { archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { purchaseRequests: true, subscriptions: true, creditEvents: true } },
    },
  });
}

async function getPendingPurchases() {
  return db.purchaseRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 4,
    include: { user: true, package: true },
  });
}

export default async function AdminPackagesPage() {
  const [packages, paymentSettings, pendingCount, pendingPurchases] = await Promise.all([
    getPackages(),
    db.paymentSettings.findUnique({ where: { id: "default" } }),
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
    getPendingPurchases(),
  ]);
  const subscriptions = packages.filter((item) => item.type === "SUBSCRIPTION");
  const creditPacks = packages.filter((item) => item.type === "CREDIT_PACK");
  const activeSubscriptions = subscriptions.filter((item) => item.isActive).length;
  const activeCreditPacks = creditPacks.filter((item) => item.isActive).length;

  return (
    <div className="space-y-4 text-right">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-studio-border bg-studio-surface text-studio-text shadow-[var(--shadow-studio-frame)]">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold text-accent-bright">Ovala Billing Ops</p>
            <h1 className="mt-2 text-xl font-semibold text-studio-text">مدیریت پکیج و پرداخت</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-studio-text-muted">
              پکیج‌های ماهانه، اعتبارهای جداگانه و تنظیمات کارت‌به‌کارت در یک مسیر عملیاتی مدیریت می‌شوند. فعال بودن یعنی نمایش به کاربر.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-md)] border border-studio-border bg-studio-surface-raised p-2">
            <div className="min-w-0 rounded-[var(--radius-sm)] bg-studio-control px-3 py-2">
              <p className="text-[11px] text-studio-text-muted">پکیج فعال</p>
              <p className="mt-1 text-lg font-semibold text-studio-text">{activeSubscriptions.toLocaleString("fa-IR")}</p>
            </div>
            <div className="min-w-0 rounded-[var(--radius-sm)] bg-studio-control px-3 py-2">
              <p className="text-[11px] text-studio-text-muted">اعتبار فعال</p>
              <p className="mt-1 text-lg font-semibold text-studio-text">{activeCreditPacks.toLocaleString("fa-IR")}</p>
            </div>
            <div className="min-w-0 rounded-[var(--radius-sm)] border border-accent-deep bg-studio-control px-3 py-2">
              <p className="text-[11px] text-accent-bright">رسید باز</p>
              <p className="mt-1 text-lg font-semibold text-studio-text">{pendingCount.toLocaleString("fa-IR")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border/80 bg-surface-soft p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-foreground text-accent-bright">
              <Card aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-accent-deep">تنظیمات مالی قابل نمایش به کاربر</p>
              <h2 className="text-base font-semibold text-foreground">پرداخت کارت‌به‌کارت</h2>
            </div>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-border-strong bg-foreground px-3 py-2 text-left text-sm font-semibold text-surface" dir="ltr">
            {cardNumberPreview(paymentSettings?.cardNumber)}
          </div>
        </div>

        <form action={updatePaymentSettingsAction} className="grid gap-3 lg:grid-cols-2">
          <label className={labelClass}>
            <span className={labelTextClass}>نام صاحب کارت</span>
            <input name="cardholderName" defaultValue={paymentSettings?.cardholderName ?? ""} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>شماره کارت</span>
            <input name="cardNumber" defaultValue={paymentSettings?.cardNumber ?? ""} dir="ltr" className={`${inputClass} text-left tabular-nums`} />
          </label>
          <label className={`${labelClass} lg:col-span-2`}>
            <span className={labelTextClass}>توضیح پرداخت</span>
            <textarea name="instructions" defaultValue={paymentSettings?.instructions ?? ""} rows={3} className={textareaClass} />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3 lg:col-span-2">
            <ToggleLine defaultChecked={paymentSettings?.isActive ?? true} label="نمایش کارت‌به‌کارت به کاربر" />
            <Button type="submit" size="sm" className="h-9 rounded-[var(--radius-sm)]">
              <ShieldTick className="h-4 w-4" />
              ذخیره اطلاعات پرداخت
            </Button>
          </div>
        </form>
      </section>

      <PendingReceipts pendingPurchases={pendingPurchases} pendingCount={pendingCount} />

      <section className="rounded-[var(--radius-lg)] border border-border/80 bg-surface p-4 shadow-[var(--shadow-soft)]">
        <SectionHeader icon={Layer} title="پکیج‌ها" eyebrow="اشتراک ماهانه با خروجی هر دوره" />
        <div className="mt-4 space-y-3">
          {subscriptions.length === 0 ? (
            <EmptyAdminState>پکیجی ثبت نشده است.</EmptyAdminState>
          ) : (
            subscriptions.map((item) => <PackageRecord key={item.id} billingPackage={item} />)
          )}
        </div>
        <PackageCreateForm type="SUBSCRIPTION" defaultSortOrder={(subscriptions.length + 1) * 10} />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-soft p-4">
        <SectionHeader icon={Wallet} title="اعتبارهای جداگانه" eyebrow="افزایش موجودی؛ جدا از اشتراک ماهانه" />
        <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-xs leading-6 text-muted">
          <ShieldTick aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-accent-deep" />
          این موارد اشتراک ماهانه نیستند؛ بعد از تایید رسید، فقط به موجودی اعتبار کاربر اضافه می‌شوند.
        </div>
        <div className="mt-4 space-y-3">
          {creditPacks.length === 0 ? (
            <EmptyAdminState>اعتبار جداگانه‌ای ثبت نشده است.</EmptyAdminState>
          ) : (
            creditPacks.map((item) => <PackageRecord key={item.id} billingPackage={item} secondary />)
          )}
        </div>
        <PackageCreateForm type="CREDIT_PACK" defaultSortOrder={(creditPacks.length + 1) * 10 + 100} />
      </section>
    </div>
  );
}
