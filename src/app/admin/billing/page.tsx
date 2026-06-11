import Link from "next/link";
import { Add, Copy, Eye, EyeSlash, ReceiptText, Save2, Trash } from "vuesax-icons-react";
import {
  adminDangerActionClass,
  adminInputClass,
  adminPrimaryActionClass,
  adminSecondaryActionClass,
  adminTableCellClass,
  adminTextareaClass,
  AdminDataTable,
  AdminEmptyState,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
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
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const [packages, paymentSettings, pendingPurchases, pendingCount, approvedCount] = await Promise.all([
    db.billingPackage.findMany({
      where: { archivedAt: null },
      orderBy: [{ type: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { purchaseRequests: true, subscriptions: true, creditEvents: true } } },
    }),
    db.paymentSettings.findUnique({ where: { id: "default" } }),
    db.purchaseRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: { user: true, package: true },
    }),
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
    db.purchaseRequest.count({ where: { status: "APPROVED" } }),
  ]);

  const subscriptions = packages.filter((item) => item.type === "SUBSCRIPTION");
  const creditPacks = packages.filter((item) => item.type === "CREDIT_PACK");

  return (
    <>
      <AdminPageHeader
        title="پرداخت و اعتبار"
        description="مدیریت پکیج‌ها، اعتبارهای جداگانه، اطلاعات کارت‌به‌کارت و رسیدهای خرید."
      />

      <AdminKpiStrip>
        <AdminKpi label="اشتراک‌ها" value={subscriptions.length} />
        <AdminKpi label="بسته اعتبار" value={creditPacks.length} />
        <AdminKpi label="رسید در انتظار" value={pendingCount} tone={pendingCount ? "attention" : "neutral"} />
        <AdminKpi label="خرید تاییدشده" value={approvedCount} />
      </AdminKpiStrip>

      <AdminPanel title="رسیدهای خرید" description="رسیدهای در انتظار تایید، به ترتیب قدیمی‌تر.">
        <AdminDataTable headers={["بسته", "کاربر", "مبلغ", "رسید", "عملیات"]} empty={<AdminEmptyState title="رسید در انتظار نداریم." />}>
          {pendingPurchases.map((request) => (
            <tr key={request.id}>
              <td className={adminTableCellClass}>
                <p className="font-semibold text-foreground">{request.package.title}</p>
                <p className="text-xs text-muted">{formatAdminDate(request.createdAt)}</p>
              </td>
              <td className={adminTableCellClass}>
                <Link href={`/admin/users/${request.userId}`} className="font-semibold text-foreground hover:underline">{getUserDisplayName(request.user)}</Link>
                <p className="text-xs text-muted" dir="ltr">{getUserIdentifier(request.user)}</p>
              </td>
              <td className={adminTableCellClass}>{formatIrr(request.amount, request.currency)}</td>
              <td className={adminTableCellClass}>
                {storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl) ? (
                  <a href={storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl) ?? ""} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-accent-deep">
                    <ReceiptText className="h-3.5 w-3.5" />
                    مشاهده
                  </a>
                ) : (
                  <span className="text-xs text-danger">بدون رسید</span>
                )}
              </td>
              <td className={adminTableCellClass}>
                <div className="flex flex-wrap gap-2">
                  <form action={approvePurchaseRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button className={adminPrimaryActionClass}>تایید</button>
                  </form>
                  <form action={rejectPurchaseRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button className={adminDangerActionClass}>رد</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <AdminPanel title="تنظیمات کارت‌به‌کارت" description="اطلاعاتی که در مسیر خرید کاربر نمایش داده می‌شود.">
          <form action={updatePaymentSettingsAction} className="grid gap-3 p-4">
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              نام صاحب کارت
              <input name="cardholderName" defaultValue={paymentSettings?.cardholderName ?? ""} className={adminInputClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              شماره کارت
              <input name="cardNumber" defaultValue={paymentSettings?.cardNumber ?? ""} dir="ltr" className={`${adminInputClass} text-left`} />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              توضیح پرداخت
              <textarea name="instructions" defaultValue={paymentSettings?.instructions ?? ""} className={adminTextareaClass} />
            </label>
            <label className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs font-semibold text-foreground">
              <input name="isActive" type="checkbox" defaultChecked={paymentSettings?.isActive ?? true} className="h-4 w-4 accent-accent" />
              نمایش به کاربر
            </label>
            <button className={adminPrimaryActionClass}>
              <Save2 className="h-4 w-4" />
              ذخیره اطلاعات پرداخت
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title="ساخت بسته جدید" description="اشتراک ماهانه یا بسته اعتبار جداگانه.">
          <form action={createBillingPackageAction} className="grid gap-3 p-4 lg:grid-cols-[160px_minmax(0,1fr)_130px_150px_110px_100px_auto] lg:items-end">
            <input type="hidden" name="currency" value="IRR" />
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              نوع
              <select name="type" defaultValue="SUBSCRIPTION" className={adminInputClass}>
                <option value="SUBSCRIPTION">اشتراک</option>
                <option value="CREDIT_PACK">بسته اعتبار</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              نام
              <input name="title" placeholder="مثلا استارتر" className={adminInputClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              اعتبار
              <input name="credits" type="number" min={0} className={adminInputClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              قیمت
              <PriceAmountInput className={adminInputClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              دوره
              <input name="periodDays" type="number" min={1} defaultValue={30} className={adminInputClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              ترتیب
              <input name="sortOrder" type="number" defaultValue={(packages.length + 1) * 10} className={adminInputClass} />
            </label>
            <input type="hidden" name="colorPreset" value="amber" />
            <label className="grid gap-1.5 text-xs font-semibold text-muted lg:col-span-6">
              توضیح
              <input name="description" className={adminInputClass} />
            </label>
            <label className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs font-semibold text-foreground">
              <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-accent" />
              فعال
            </label>
            <button className={adminPrimaryActionClass}>
              <Add className="h-4 w-4" />
              ساخت
            </button>
          </form>
        </AdminPanel>
      </div>

      <AdminPanel title="پکیج‌ها و اعتبارها" description="ویرایش مستقیم محصول‌های مالی؛ فعال بودن یعنی نمایش به کاربر.">
        <AdminDataTable headers={["بسته", "نوع", "قیمت", "اعتبار/دوره", "وضعیت", "استفاده", "عملیات"]} empty={<AdminEmptyState title="بسته‌ای ثبت نشده است." />}>
          {packages.map((billingPackage) => {
            const ActiveIcon = billingPackage.isActive ? Eye : EyeSlash;
            const usageCount = billingPackage.type === "SUBSCRIPTION" ? billingPackage._count.subscriptions : billingPackage._count.creditEvents;
            return (
              <tr key={billingPackage.id}>
                <td className={adminTableCellClass}>
                  <form id={`package-${billingPackage.id}`} action={updateBillingPackageAction} className="grid gap-2">
                    <input type="hidden" name="packageId" value={billingPackage.id} />
                    <input type="hidden" name="type" value={billingPackage.type} />
                    <input type="hidden" name="currency" value={billingPackage.currency} />
                    <input type="hidden" name="colorPreset" value={billingPackage.colorPreset} />
                    <input name="title" defaultValue={billingPackage.title} className={adminInputClass} />
                    <input name="description" defaultValue={billingPackage.description} className={adminInputClass} />
                  </form>
                </td>
                <td className={adminTableCellClass}><AdminStatus status={billingPackage.type} /></td>
                <td className={adminTableCellClass}>
                  <PriceAmountInput form={`package-${billingPackage.id}`} defaultValue={billingPackage.priceAmount} className={adminInputClass} />
                </td>
                <td className={adminTableCellClass}>
                  <div className="grid gap-2">
                    <input form={`package-${billingPackage.id}`} name="credits" type="number" min={0} defaultValue={billingPackage.credits} className={adminInputClass} />
                    <input form={`package-${billingPackage.id}`} name="periodDays" type="number" min={1} defaultValue={billingPackage.periodDays ?? 30} className={adminInputClass} />
                    <input form={`package-${billingPackage.id}`} name="sortOrder" type="number" defaultValue={billingPackage.sortOrder} className={adminInputClass} />
                  </div>
                </td>
                <td className={adminTableCellClass}>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                    <input form={`package-${billingPackage.id}`} name="isActive" type="checkbox" defaultChecked={billingPackage.isActive} className="h-4 w-4 accent-accent" />
                    <ActiveIcon className="h-4 w-4" />
                    {billingPackage.isActive ? "فعال" : "پنهان"}
                  </label>
                </td>
                <td className={adminTableCellClass}>
                  <p className="text-xs text-muted">
                    {billingPackage._count.purchaseRequests.toLocaleString("fa-IR")} خرید · {usageCount.toLocaleString("fa-IR")} استفاده
                  </p>
                </td>
                <td className={adminTableCellClass}>
                  <div className="flex flex-wrap gap-2">
                    <button form={`package-${billingPackage.id}`} className={adminPrimaryActionClass}>
                      <Save2 className="h-4 w-4" />
                      ذخیره
                    </button>
                    <form action={duplicateBillingPackageAction}>
                      <input type="hidden" name="packageId" value={billingPackage.id} />
                      <button className={adminSecondaryActionClass}>
                        <Copy className="h-4 w-4" />
                        کپی
                      </button>
                    </form>
                    <form action={deleteBillingPackageAction}>
                      <input type="hidden" name="packageId" value={billingPackage.id} />
                      <button className={adminDangerActionClass}>
                        <Trash className="h-4 w-4" />
                        حذف
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminDataTable>
      </AdminPanel>
    </>
  );
}
