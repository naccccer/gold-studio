import Link from "next/link";
import {
  BadgeCheck,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FileImage,
  Layers3,
  PackagePlus,
  Plus,
  ReceiptText,
  Save,
  ShieldCheck,
  Trash2,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyAdminState, formatAdminDate, formatIrr } from "@/features/admin/components/admin-ui";
import {
  approvePurchaseRequestAction,
  createBillingPackageAction,
  deleteBillingPackageAction,
  duplicateBillingPackageAction,
  reconcileApprovedPurchasesAction,
  rejectPurchaseRequestAction,
  updateBillingPackageAction,
  updatePaymentSettingsAction,
} from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type PackageWithCounts = Awaited<ReturnType<typeof getPackages>>[number];
type PendingPurchase = Awaited<ReturnType<typeof getPendingPurchases>>[number];

const inputClass =
  "h-10 w-full min-w-0 rounded-[0.45rem] border border-[#cfc2ad] bg-[#fffefa] px-3 text-sm text-[#171411] outline-none transition placeholder:text-[#9b9184] focus:border-[#9b7845] focus:shadow-[0_0_0_3px_rgba(178,139,82,0.16)]";
const compactInputClass =
  "h-9 w-full min-w-0 rounded-[0.4rem] border border-[#cfc2ad] bg-[#fffefa] px-2.5 text-sm text-[#171411] outline-none transition placeholder:text-[#9b9184] focus:border-[#9b7845] focus:shadow-[0_0_0_3px_rgba(178,139,82,0.16)]";
const textareaClass =
  "min-h-24 w-full min-w-0 rounded-[0.45rem] border border-[#cfc2ad] bg-[#fffefa] px-3 py-2 text-sm text-[#171411] outline-none transition placeholder:text-[#9b9184] focus:border-[#9b7845] focus:shadow-[0_0_0_3px_rgba(178,139,82,0.16)]";
const labelClass = "grid min-w-0 gap-1.5";
const labelTextClass = "text-[11px] font-semibold text-[#5d554b]";

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
    <label className="inline-flex min-h-10 items-center gap-2 rounded-[0.45rem] border border-[#cfc2ad] bg-[#fffefa] px-3 text-xs font-medium text-[#4f473f]">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-[#9b7845]" />
      {label}
    </label>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-[0.45rem] border border-[#dfd4c4] bg-[#f7f1e8] px-2.5 py-1.5">
      <p className="text-[11px] font-medium text-[#756b60]">{label}</p>
      <p className="truncate text-sm font-semibold leading-6 text-[#171411]">
        {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
      </p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  eyebrow,
}: {
  icon: typeof Layers3;
  title: string;
  eyebrow: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d8ccba] pb-3">
      <div>
        <p className="text-[11px] font-semibold text-[#8a6a3b]">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold text-[#171411]">{title}</h2>
      </div>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.55rem] border border-[#c8b795] bg-[#211c17] text-[#e6c98f]">
        <Icon aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={1.8} />
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
    <form action={createBillingPackageAction} className="border-t border-[#d8ccba] pt-4">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="currency" value="IRR" />
      <input type="hidden" name="sortOrder" value={defaultSortOrder} />

      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#211c17]">
        <Plus aria-hidden="true" className="h-4 w-4 text-[#8a6a3b]" />
        {isSubscription ? "افزودن پکیج ماهانه" : "افزودن اعتبار جداگانه"}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_120px_150px_110px_auto] lg:items-end">
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
          <input name="priceAmount" type="number" min={0} placeholder="59000000" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>دوره</span>
          <input
            name="periodDays"
            type="number"
            min={1}
            defaultValue={isSubscription ? 30 : 1}
            disabled={!isSubscription}
            className={`${inputClass} disabled:bg-[#eee7dc] disabled:text-[#8c8174]`}
          />
        </label>
        <Button type="submit" size="sm" className="h-10 rounded-[0.45rem]">
          <PackagePlus className="h-4 w-4" />
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
  const ActiveIcon = billingPackage.isActive ? Eye : EyeOff;
  const usageCount = isSubscription ? billingPackage._count.subscriptions : billingPackage._count.creditEvents;

  return (
    <form
      action={updateBillingPackageAction}
      className={[
        "rounded-[0.7rem] border border-[#d5c8b8] bg-[#fffefa] p-2.5 shadow-[0_16px_34px_-32px_rgba(23,20,17,0.65)]",
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
          <div className="grid gap-2 border-b border-[#e0d6c8] pb-2.5 lg:grid-cols-[minmax(180px,1fr)_126px_104px_130px_104px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.45rem] bg-[#211c17] text-[#e6c98f]">
                  <ActiveIcon aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#8a6a3b]">{isSubscription ? "پکیج ماهانه" : "اعتبار جداگانه"}</p>
                  <h3 className="truncate text-lg font-semibold leading-7 text-[#171411]">{billingPackage.title}</h3>
                </div>
              </div>
            </div>
            <StatCell label="وضعیت" value={activeLabel} />
            <StatCell label={isSubscription ? "خروجی" : "اعتبار"} value={billingPackage.credits} />
            <StatCell label="قیمت" value={formatIrr(billingPackage.priceAmount, billingPackage.currency)} />
            <StatCell label="خرید/استفاده" value={`${billingPackage._count.purchaseRequests.toLocaleString("fa-IR")} / ${usageCount.toLocaleString("fa-IR")}`} />
          </div>

          <div className="mt-2.5 grid gap-2 lg:grid-cols-[minmax(130px,0.9fr)_minmax(220px,1.6fr)_96px_132px_88px_88px] lg:items-end">
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
              <input name="priceAmount" type="number" min={0} defaultValue={billingPackage.priceAmount} className={compactInputClass} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>دوره</span>
              <input
                name="periodDays"
                type="number"
                min={1}
                defaultValue={billingPackage.periodDays ?? 30}
                disabled={!isSubscription}
                className={`${compactInputClass} disabled:bg-[#eee7dc] disabled:text-[#8c8174]`}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>ترتیب</span>
              <input name="sortOrder" type="number" defaultValue={billingPackage.sortOrder} className={compactInputClass} />
            </label>
          </div>
        </div>

        <div className="grid gap-2 border-t border-[#e0d6c8] pt-2.5 sm:grid-cols-4 xl:flex xl:flex-col xl:border-r xl:border-t-0 xl:pr-2.5 xl:pt-0">
          <ToggleLine defaultChecked={billingPackage.isActive} label="فعال" />
          <Button type="submit" size="sm" className="h-9 rounded-[0.45rem] xl:w-full">
            <Save className="h-4 w-4" />
            ذخیره
          </Button>
          <button
            formAction={duplicateBillingPackageAction}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[0.45rem] border border-[#cfc2ad] bg-[#fffefa] px-3 text-xs font-medium text-[#3f3831] transition hover:border-[#9b7845] xl:w-full"
          >
            <Copy className="h-3.5 w-3.5" />
            کپی
          </button>
          <button
            formAction={deleteBillingPackageAction}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[0.45rem] border border-[#a64b43]/35 bg-[#f8ebe8] px-3 text-xs font-semibold text-[#983b34] transition hover:border-[#983b34] xl:mt-auto xl:w-full"
          >
            <Trash2 className="h-3.5 w-3.5" />
            حذف
          </button>
        </div>
      </div>
    </form>
  );
}

function PendingReceipts({ pendingPurchases, pendingCount }: { pendingPurchases: PendingPurchase[]; pendingCount: number }) {
  return (
    <section className="rounded-[0.85rem] border border-[#c8b795] bg-[#fffefa] shadow-[0_22px_48px_-42px_rgba(23,20,17,0.65)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8ccba] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.55rem] bg-[#211c17] text-[#e6c98f]">
            <ReceiptText aria-hidden="true" className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[#171411]">بررسی رسیدهای خرید</h2>
            <p className="text-xs text-[#756b60]">تایید رسید، اشتراک یا اعتبار را برای کاربر فعال می‌کند.</p>
          </div>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex h-10 items-center justify-center rounded-[0.45rem] border border-[#cfc2ad] bg-[#f4efe7] px-3 text-xs font-semibold text-[#3f3831] transition hover:border-[#9b7845]"
        >
          مشاهده کاربران
        </Link>
      </div>

      {pendingPurchases.length === 0 ? (
        <div className="px-4 py-4">
          <EmptyAdminState>درخواست خرید در انتظار تایید نیست.</EmptyAdminState>
        </div>
      ) : (
        <div className="divide-y divide-[#e0d6c8]">
          {pendingPurchases.map((request) => (
            <div key={request.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="font-semibold text-[#171411]">{request.package.title}</p>
                <p className="truncate text-xs text-[#756b60]">
                  {getUserDisplayName(request.user)} · {getUserIdentifier(request.user)}
                </p>
              </div>
              <div className="text-xs text-[#5d554b]">
                <p>{formatIrr(request.amount, request.currency)} · {formatAdminDate(request.createdAt)}</p>
                {request.receiptImageUrl ? (
                  <a href={request.receiptImageUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-[#7b5d31]">
                    <FileImage className="h-3.5 w-3.5" />
                    مشاهده رسید
                  </a>
                ) : (
                  <p className="mt-1 text-[#983b34]">رسید هنوز ارسال نشده است.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={approvePurchaseRequestAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-[0.45rem] bg-[#211c17] px-3 text-xs font-semibold text-[#fffefa]">
                    <Check className="h-3.5 w-3.5" />
                    تایید
                  </button>
                </form>
                <form action={rejectPurchaseRequestAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <button className="h-9 rounded-[0.45rem] border border-[#a64b43]/35 bg-[#f8ebe8] px-3 text-xs font-semibold text-[#983b34]">
                    رد
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
      {pendingCount > pendingPurchases.length ? (
        <p className="border-t border-[#e0d6c8] px-4 py-3 text-xs text-[#756b60]">
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
      <section className="overflow-hidden rounded-[0.9rem] border border-[#bba785] bg-[#171411] text-[#fffefa] shadow-[0_24px_70px_-48px_rgba(23,20,17,0.95)]">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d3b776]">Ovala Billing Ops</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#fffefa]">مدیریت پکیج و پرداخت</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#d9d0c2]">
              پکیج‌های ماهانه، اعتبارهای جداگانه و تنظیمات کارت‌به‌کارت در یک مسیر عملیاتی مدیریت می‌شوند. فعال بودن یعنی نمایش به کاربر.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-[0.75rem] border border-[#4d4234] bg-[#211c17] p-2">
            <div className="min-w-0 rounded-[0.55rem] bg-[#2b251e] px-3 py-2">
              <p className="text-[11px] text-[#bdb2a4]">پکیج فعال</p>
              <p className="mt-1 text-xl font-semibold text-[#fffefa]">{activeSubscriptions.toLocaleString("fa-IR")}</p>
            </div>
            <div className="min-w-0 rounded-[0.55rem] bg-[#2b251e] px-3 py-2">
              <p className="text-[11px] text-[#bdb2a4]">اعتبار فعال</p>
              <p className="mt-1 text-xl font-semibold text-[#fffefa]">{activeCreditPacks.toLocaleString("fa-IR")}</p>
            </div>
            <div className="min-w-0 rounded-[0.55rem] border border-[#7b5d31] bg-[#352b20] px-3 py-2">
              <p className="text-[11px] text-[#e6c98f]">رسید باز</p>
              <p className="mt-1 text-xl font-semibold text-[#fffefa]">{pendingCount.toLocaleString("fa-IR")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[0.85rem] border border-[#c8b795] bg-[#f7f1e8] p-4 shadow-[0_22px_48px_-42px_rgba(23,20,17,0.65)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.55rem] bg-[#211c17] text-[#e6c98f]">
              <CreditCard aria-hidden="true" className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-[#8a6a3b]">تنظیمات مالی قابل نمایش به کاربر</p>
              <h2 className="text-lg font-semibold text-[#171411]">پرداخت کارت‌به‌کارت</h2>
            </div>
          </div>
          <div className="rounded-[0.6rem] border border-[#c8b795] bg-[#211c17] px-3 py-2 text-left text-sm font-semibold text-[#fffefa]" dir="ltr">
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d8ccba] pt-3 lg:col-span-2">
            <ToggleLine defaultChecked={paymentSettings?.isActive ?? true} label="نمایش کارت‌به‌کارت به کاربر" />
            <Button type="submit" size="sm" className="h-10 rounded-[0.45rem]">
              <ShieldCheck className="h-4 w-4" />
              ذخیره اطلاعات پرداخت
            </Button>
          </div>
        </form>
      </section>

      <PendingReceipts pendingPurchases={pendingPurchases} pendingCount={pendingCount} />

      <section className="rounded-[0.85rem] border border-[#c8b795] bg-[#fffefa] p-4 shadow-[0_22px_48px_-42px_rgba(23,20,17,0.65)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#171411]">آشتی خریدهای تاییدشده</h2>
            <p className="mt-1 text-xs leading-6 text-[#756b60]">
              خریدهای تاییدشده قدیمی که به رویداد اعتبار یا اشتراک وصل نشده‌اند، در صورت قطعی بودن لینک می‌شوند.
            </p>
          </div>
          <form action={reconcileApprovedPurchasesAction}>
            <Button type="submit" size="sm" className="h-10 rounded-[0.45rem]">
              اجرای آشتی
            </Button>
          </form>
        </div>
      </section>

      <section className="rounded-[0.85rem] border border-[#c8b795] bg-[#fffefa] p-4 shadow-[0_22px_48px_-42px_rgba(23,20,17,0.65)]">
        <SectionHeader icon={Layers3} title="پکیج‌ها" eyebrow="اشتراک ماهانه با خروجی هر دوره" />
        <div className="mt-4">
          {subscriptions.length === 0 ? (
            <EmptyAdminState>پکیجی ثبت نشده است.</EmptyAdminState>
          ) : (
            subscriptions.map((item) => <PackageRecord key={item.id} billingPackage={item} />)
          )}
        </div>
        <PackageCreateForm type="SUBSCRIPTION" defaultSortOrder={(subscriptions.length + 1) * 10} />
      </section>

      <section className="rounded-[0.85rem] border border-dashed border-[#bba785] bg-[#f4efe7] p-4">
        <SectionHeader icon={WalletCards} title="اعتبارهای جداگانه" eyebrow="افزایش موجودی؛ جدا از اشتراک ماهانه" />
        <div className="mt-3 flex items-start gap-2 rounded-[0.65rem] border border-[#d8ccba] bg-[#fffefa] px-3 py-2 text-xs leading-6 text-[#5d554b]">
          <BadgeCheck aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#8a6a3b]" />
          این موارد اشتراک ماهانه نیستند؛ بعد از تایید رسید، فقط به موجودی اعتبار کاربر اضافه می‌شوند.
        </div>
        <div className="mt-4">
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
