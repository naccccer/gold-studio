import Link from "next/link";
import { Add, ArrowDown2, Copy, ReceiptText, Save2 } from "vuesax-icons-react";
import type { Prisma } from "@/generated/prisma";
import { ConfirmAction } from "@/components/ui/confirm-action";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  cellClass,
  checkboxClass,
  ConsoleHeader,
  ConsoleTable,
  Disclosure,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  formatAdminDate,
  formatIrr,
  StatusDot,
  Surface,
  TabNav,
  textareaClass,
} from "@/features/admin/components/console";
import { PriceAmountInput } from "@/features/admin/components/price-amount-input";
import { BILLING_PLAN_COLOR_PRESETS, normalizeBillingPlanColorPreset } from "@/lib/billing-plan-colors";
import { requireAdminOrSalesSession } from "@/lib/auth/session";
import { creditUnitsToVisibleCredits } from "@/lib/credit-units";
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
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";
import { getVerticalLabel, USER_VISIBLE_VERTICAL_IDS } from "@/lib/verticals";

export const dynamic = "force-dynamic";

type AdminBillingPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function AdminBillingPage({ searchParams }: AdminBillingPageProps) {
  const session = await requireAdminOrSalesSession();
  const isAdmin = session.role === "ADMIN";
  const params = await searchParams;
  const activeTab = isAdmin && (params?.tab === "packages" || params?.tab === "settings") ? params.tab : "receipts";

  const [packages, paymentSettings, pendingPurchases, pendingCount] = await Promise.all([
    db.billingPackage.findMany({
      where: { archivedAt: null },
      orderBy: [{ vertical: "asc" }, { type: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { purchaseRequests: true, subscriptions: true, creditEvents: true } } },
    }),
    db.paymentSettings.findUnique({ where: { id: "default" } }),
    db.purchaseRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 30,
      include: { user: true, package: true },
    }),
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <>
      <ConsoleHeader
        title="پرداخت و اعتبار"
        meta={
          pendingCount > 0 ? (
            <span className="font-medium text-amber-700">{faNum(pendingCount)} رسید در انتظار بررسی</span>
          ) : (
            <span>رسید در انتظاری وجود ندارد</span>
          )
        }
      />

      <TabNav
        tabs={[
          { href: "/admin/billing", label: "بررسی رسیدها", active: activeTab === "receipts", count: pendingCount },
          ...(isAdmin
            ? [
                { href: "/admin/billing?tab=packages", label: "کاتالوگ بسته‌ها", active: activeTab === "packages", count: packages.length },
                { href: "/admin/billing?tab=settings", label: "تنظیمات پرداخت", active: activeTab === "settings" },
              ]
            : []),
        ]}
      />

      {activeTab === "receipts" ? <ReceiptsTab pendingPurchases={pendingPurchases} /> : null}
      {activeTab === "packages" ? <PackagesTab packages={packages} /> : null}
      {activeTab === "settings" ? <SettingsTab paymentSettings={paymentSettings} /> : null}
    </>
  );
}

type PendingPurchase = Prisma.PurchaseRequestGetPayload<{ include: { user: true; package: true } }>;

function VerticalBadge({ vertical }: { vertical: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700">
      {getVerticalLabel(vertical)}
    </span>
  );
}

function ReceiptsTab({ pendingPurchases }: { pendingPurchases: PendingPurchase[] }) {
  return (
    <Surface>
      <ConsoleTable
        head={["بسته", "ورتیکال", "کاربر", "مبلغ", "رسید", ""]}
        empty={<EmptyState title="رسید در انتظار بررسی نداریم." />}
      >
        {pendingPurchases.map((request) => {
          const receiptUrl = storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl);
          return (
            <tr key={request.id}>
              <td className={cellClass}>
                <p className="font-medium">{request.package.title}</p>
                <p className="text-xs text-slate-400">{formatAdminDate(request.createdAt)}</p>
              </td>
              <td className={cellClass}>
                <VerticalBadge vertical={request.vertical} />
                {request.package.vertical !== request.vertical ? (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">عدم تطابق بسته</p>
                ) : null}
              </td>
              <td className={cellClass}>
                <Link href={`/admin/users/${request.userId}`} className="font-medium hover:text-navy-700 hover:underline">
                  {getUserDisplayName(request.user)}
                </Link>
                <p className="text-xs text-slate-400" dir="ltr">
                  {getUserIdentifier(request.user)}
                </p>
              </td>
              <td className={`${cellClass} tabular-nums`}>{formatIrr(request.amount, request.currency)}</td>
              <td className={cellClass}>
                {receiptUrl ? (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                  >
                    <ReceiptText className="h-3.5 w-3.5" />
                    مشاهده رسید
                  </a>
                ) : (
                  <span className="text-xs text-rose-600">بدون رسید</span>
                )}
              </td>
              <td className={cellClass}>
                <div className="flex justify-end gap-1.5">
                  <form action={approvePurchaseRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button className={btnPrimary}>تایید</button>
                  </form>
                  <form action={rejectPurchaseRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button className={btnDanger}>رد</button>
                  </form>
                </div>
              </td>
            </tr>
          );
        })}
      </ConsoleTable>
    </Surface>
  );
}

type BillingPackageWithCounts = Prisma.BillingPackageGetPayload<{
  include: { _count: { select: { purchaseRequests: true; subscriptions: true; creditEvents: true } } };
}>;

function PackageFormFields({
  billingPackage,
  nextSortOrder,
}: {
  billingPackage?: BillingPackageWithCounts;
  nextSortOrder?: number;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="نام بسته">
          <input name="title" required defaultValue={billingPackage?.title} className={fieldClass} />
        </Field>
        <Field label="قیمت (ریال)">
          <PriceAmountInput className={fieldClass} defaultValue={billingPackage?.priceAmount} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="خروجی">
          <input
            name="credits"
            type="number"
            min={0}
            required
            defaultValue={billingPackage ? creditUnitsToVisibleCredits(billingPackage.credits) : undefined}
            className={fieldClass}
          />
        </Field>
        <Field label="پروژه">
          <input name="projectLimit" type="number" min={0} defaultValue={billingPackage?.projectLimit ?? ""} placeholder="بدون سقف" className={fieldClass} />
        </Field>
        <Field label="نسخه دیگر">
          <input name="freeVariantLimit" type="number" min={0} defaultValue={billingPackage?.freeVariantLimit ?? 2} className={fieldClass} />
        </Field>
        <Field label="دوره (روز)">
          <input name="periodDays" type="number" min={1} defaultValue={billingPackage?.periodDays ?? 30} className={fieldClass} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ترتیب">
          <input name="sortOrder" type="number" defaultValue={billingPackage?.sortOrder ?? nextSortOrder ?? 10} className={fieldClass} />
        </Field>
      </div>
      <Field label="توضیح">
        <input name="description" defaultValue={billingPackage?.description} className={fieldClass} />
      </Field>
      <fieldset className="grid gap-1.5">
        <legend className="text-xs font-medium text-slate-600">رنگ کارت پلن در اپ کاربر</legend>
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
          {BILLING_PLAN_COLOR_PRESETS.map((preset) => (
            <label key={preset.id} className="cursor-pointer" title={preset.label}>
              <input
                type="radio"
                name="colorPreset"
                value={preset.id}
                defaultChecked={normalizeBillingPlanColorPreset(billingPackage?.colorPreset) === preset.id}
                className="peer sr-only"
              />
              <span
                className="block h-7 w-7 rounded-full border-2 border-transparent transition peer-checked:border-navy-900 peer-checked:ring-2 peer-checked:ring-navy-100 peer-focus-visible:ring-2 peer-focus-visible:ring-navy-300"
                style={{ backgroundColor: preset.swatch }}
              >
                <span className="sr-only">{preset.label}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="inline-flex items-center gap-2 text-xs font-medium text-navy-900">
        <input name="isActive" type="checkbox" defaultChecked={billingPackage ? billingPackage.isActive : true} className={checkboxClass} />
        به کاربران نمایش داده شود
      </label>
    </>
  );
}

function packageUsageCount(billingPackage: BillingPackageWithCounts) {
  return billingPackage.type === "SUBSCRIPTION" ? billingPackage._count.subscriptions : billingPackage._count.creditEvents;
}

function packageTypeLabel(type: BillingPackageWithCounts["type"]) {
  return type === "SUBSCRIPTION" ? "اشتراک" : "بسته اعتبار";
}

function PackageEditor({ billingPackage }: { billingPackage: BillingPackageWithCounts }) {
  return (
    <form action={updateBillingPackageAction} className="grid gap-3">
      <input type="hidden" name="packageId" value={billingPackage.id} />
      <input type="hidden" name="type" value={billingPackage.type} />
      <input type="hidden" name="currency" value={billingPackage.currency} />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-navy-25 px-3 py-2">
        <span className="text-xs font-semibold text-navy-950">ویرایش بسته</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-sm" dir="ltr">
          {billingPackage.vertical}
        </span>
      </div>
      <PackageFormFields billingPackage={billingPackage} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex gap-1.5">
          <button className={btnPrimary}>
            <Save2 className="h-4 w-4" />
            ذخیره بسته
          </button>
          <button formAction={duplicateBillingPackageAction} className={btnSecondary}>
            <Copy className="h-4 w-4" />
            ساخت کپی
          </button>
        </div>
        <ConfirmAction
          action={deleteBillingPackageAction}
          fields={[{ name: "packageId", value: billingPackage.id }]}
          title="بسته حذف شود؟"
          description="از خریدهای جدید حذف می‌شود."
          confirmLabel="حذف"
          triggerLabel="حذف بسته"
          triggerClassName={btnDanger}
          triggerIcon="trash"
        />
      </div>
    </form>
  );
}

function PackageDisclosure({ billingPackage }: { billingPackage: BillingPackageWithCounts }) {
  const usageCount = packageUsageCount(billingPackage);
  const swatch = BILLING_PLAN_COLOR_PRESETS.find(
    (preset) => preset.id === normalizeBillingPlanColorPreset(billingPackage.colorPreset),
  )?.swatch;

  return (
    <details className="group min-w-0">
      <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-navy-25/70 group-open:bg-navy-50/80 [&::-webkit-details-marker]:hidden">
        <span className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <span className="flex min-w-0 items-center gap-2">
            <StatusDot status={billingPackage.isActive ? "ACTIVE" : "PAUSED"} label="" />
            <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: swatch }} />
            <span className="truncate font-semibold text-navy-950">{billingPackage.title}</span>
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 sm:justify-end">
            <span className="rounded-full bg-navy-50 px-2 py-0.5 font-medium text-navy-700">{packageTypeLabel(billingPackage.type)}</span>
            <span className="tabular-nums">{formatIrr(billingPackage.priceAmount, billingPackage.currency)}</span>
            <span>{faNum(creditUnitsToVisibleCredits(billingPackage.credits))} خروجی</span>
            {billingPackage.type === "SUBSCRIPTION" && billingPackage.projectLimit !== null ? (
              <span>{faNum(billingPackage.projectLimit)} پروژه</span>
            ) : null}
            <span>{faNum(usageCount)} استفاده</span>
          </span>
        </span>
        <ArrowDown2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-400 transition duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-y border-slate-200 bg-slate-50 px-3 pb-3 pt-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <PackageEditor billingPackage={billingPackage} />
        </div>
      </div>
    </details>
  );
}

function PackageColumn({
  title,
  packages,
}: {
  title: string;
  packages: BillingPackageWithCounts[];
}) {
  return (
    <section className="min-w-0">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h3 className="text-xs font-semibold text-navy-950">{title}</h3>
        <span className="text-[11px] tabular-nums text-slate-400">{faNum(packages.length)}</span>
      </div>
      {packages.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState title="بسته‌ای در این بخش نیست." />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {packages.map((billingPackage) => (
            <PackageDisclosure key={billingPackage.id} billingPackage={billingPackage} />
          ))}
        </div>
      )}
    </section>
  );
}

function PackagesTab({ packages }: { packages: BillingPackageWithCounts[] }) {
  const sections = USER_VISIBLE_VERTICAL_IDS.map((vertical) => {
    const verticalPackages = packages.filter((billingPackage) => billingPackage.vertical === vertical);
    return {
      vertical,
      packages: verticalPackages,
      subscriptions: verticalPackages.filter((billingPackage) => billingPackage.type === "SUBSCRIPTION"),
      creditPacks: verticalPackages.filter((billingPackage) => billingPackage.type === "CREDIT_PACK"),
      activeCount: verticalPackages.filter((billingPackage) => billingPackage.isActive).length,
    };
  });

  return (
    <div className="space-y-4">
      <Disclosure
        summary={
          <>
            <Add className="h-4 w-4 text-slate-400" />
            ساخت بسته جدید
          </>
        }
      >
        <form action={createBillingPackageAction} className="grid max-w-2xl gap-3">
          <input type="hidden" name="currency" value="IRR" />
          <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ورتیکال">
          <select name="vertical" defaultValue="jewelry" className={fieldClass}>
            {USER_VISIBLE_VERTICAL_IDS.map((vertical) => (
              <option key={vertical} value={vertical}>
                {getVerticalLabel(vertical)}
              </option>
            ))}
          </select>
            </Field>
            <Field label="نوع بسته">
              <select name="type" defaultValue="SUBSCRIPTION" className={fieldClass}>
                <option value="SUBSCRIPTION">اشتراک ماهانه</option>
                <option value="CREDIT_PACK">بسته اعتبار جداگانه</option>
              </select>
            </Field>
          </div>
          <PackageFormFields nextSortOrder={(packages.length + 1) * 10} />
          <div className="border-t border-slate-100 pt-3">
            <button className={btnPrimary}>
              <Add className="h-4 w-4" />
              ساخت بسته
            </button>
          </div>
        </form>
      </Disclosure>

      {packages.length === 0 ? (
        <Surface className="p-8">
          <EmptyState title="بسته‌ای ثبت نشده است." />
        </Surface>
      ) : (
        <div className="grid gap-4">
          {sections.map((section) => (
            <Surface key={section.vertical}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-navy-950">{getVerticalLabel(section.vertical)}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {faNum(section.packages.length)} بسته · {faNum(section.activeCount)} فعال
                  </p>
                </div>
                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600" dir="ltr">
                  {section.vertical}
                </span>
              </div>
              <div className="grid min-w-0 lg:grid-cols-2 lg:divide-x lg:divide-x-reverse lg:divide-slate-100">
                <PackageColumn title="اشتراک‌ها" packages={section.subscriptions} />
                <PackageColumn title="بسته‌های اعتبار" packages={section.creditPacks} />
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({
  paymentSettings,
}: {
  paymentSettings: Awaited<ReturnType<typeof db.paymentSettings.findUnique>>;
}) {
  return (
    <Surface>
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-navy-950">کارت‌به‌کارت</h2>
      </div>
      <form action={updatePaymentSettingsAction} className="grid max-w-xl gap-4 p-5">
        <Field label="نام صاحب کارت">
          <input name="cardholderName" defaultValue={paymentSettings?.cardholderName ?? ""} className={fieldClass} />
        </Field>
        <Field label="شماره کارت">
          <input name="cardNumber" defaultValue={paymentSettings?.cardNumber ?? ""} dir="ltr" className={`${fieldClass} text-left tabular-nums`} />
        </Field>
        <Field label="توضیح پرداخت">
          <textarea name="instructions" defaultValue={paymentSettings?.instructions ?? ""} className={textareaClass} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-navy-900">
            <input name="isActive" type="checkbox" defaultChecked={paymentSettings?.isActive ?? true} className={checkboxClass} />
            نمایش به کاربر
          </label>
          <button className={btnPrimary}>
            <Save2 className="h-4 w-4" />
            ذخیره تنظیمات
          </button>
        </div>
      </form>
    </Surface>
  );
}
