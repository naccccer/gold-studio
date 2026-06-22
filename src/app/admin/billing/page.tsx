import Link from "next/link";
import { Add, Copy, ReceiptText, Save2 } from "vuesax-icons-react";
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

export const dynamic = "force-dynamic";

type AdminBillingPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function AdminBillingPage({ searchParams }: AdminBillingPageProps) {
  const params = await searchParams;
  const activeTab = params?.tab === "packages" || params?.tab === "settings" ? params.tab : "receipts";

  const [packages, paymentSettings, pendingPurchases, pendingCount] = await Promise.all([
    db.billingPackage.findMany({
      where: { archivedAt: null },
      orderBy: [{ type: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
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
          { href: "/admin/billing?tab=packages", label: "کاتالوگ بسته‌ها", active: activeTab === "packages", count: packages.length },
          { href: "/admin/billing?tab=settings", label: "تنظیمات پرداخت", active: activeTab === "settings" },
        ]}
      />

      {activeTab === "receipts" ? <ReceiptsTab pendingPurchases={pendingPurchases} /> : null}
      {activeTab === "packages" ? <PackagesTab packages={packages} /> : null}
      {activeTab === "settings" ? <SettingsTab paymentSettings={paymentSettings} /> : null}
    </>
  );
}

type PendingPurchase = Prisma.PurchaseRequestGetPayload<{ include: { user: true; package: true } }>;

function ReceiptsTab({ pendingPurchases }: { pendingPurchases: PendingPurchase[] }) {
  return (
    <Surface>
      <ConsoleTable
        head={["بسته", "کاربر", "مبلغ", "رسید", ""]}
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
          <input name="credits" type="number" min={0} required defaultValue={billingPackage?.credits} className={fieldClass} />
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

function PackagesTab({ packages }: { packages: BillingPackageWithCounts[] }) {
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
          <Field label="نوع بسته">
            <select name="type" defaultValue="SUBSCRIPTION" className={fieldClass}>
              <option value="SUBSCRIPTION">اشتراک ماهانه</option>
              <option value="CREDIT_PACK">بسته اعتبار جداگانه</option>
            </select>
          </Field>
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
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {packages.map((billingPackage) => {
            const usageCount =
              billingPackage.type === "SUBSCRIPTION"
                ? billingPackage._count.subscriptions
                : billingPackage._count.creditEvents;
            return (
              <Disclosure
                key={billingPackage.id}
                flush
                summary={
                  <>
                    <StatusDot status={billingPackage.isActive ? "ACTIVE" : "PAUSED"} label="" />
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: BILLING_PLAN_COLOR_PRESETS.find(
                          (preset) => preset.id === normalizeBillingPlanColorPreset(billingPackage.colorPreset),
                        )?.swatch,
                      }}
                    />
                    <span className="truncate font-medium text-navy-950">{billingPackage.title}</span>
                    <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-700">
                      {billingPackage.type === "SUBSCRIPTION" ? "اشتراک" : "بسته اعتبار"}
                    </span>
                    <span className="hidden text-xs tabular-nums text-slate-500 sm:inline">
                      {formatIrr(billingPackage.priceAmount, billingPackage.currency)}
                    </span>
                    <span className="hidden text-xs text-slate-400 md:inline">
                      {billingPackage.projectLimit !== null ? `${faNum(billingPackage.projectLimit)} پروژه · ` : ""}
                      {faNum(billingPackage.credits)} خروجی · {faNum(usageCount)} استفاده
                    </span>
                  </>
                }
              >
                <form action={updateBillingPackageAction} className="grid max-w-2xl gap-3">
                  <input type="hidden" name="packageId" value={billingPackage.id} />
                  <input type="hidden" name="type" value={billingPackage.type} />
                  <input type="hidden" name="currency" value={billingPackage.currency} />
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
              </Disclosure>
            );
          })}
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
