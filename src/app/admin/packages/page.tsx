import { Copy, CreditCard, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminMetric, AdminSection, EmptyAdminState, formatIrr } from "@/features/admin/components/admin-ui";
import {
  createBillingPackageAction,
  deleteBillingPackageAction,
  duplicateBillingPackageAction,
  updateBillingPackageAction,
  updatePaymentSettingsAction,
} from "@/features/admin/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type PackageWithCounts = Awaited<ReturnType<typeof getPackages>>[number];

function PackageForm({
  type,
  defaultSortOrder,
}: {
  type: "SUBSCRIPTION" | "CREDIT_PACK";
  defaultSortOrder: number;
}) {
  const isSubscription = type === "SUBSCRIPTION";

  return (
    <form
      action={createBillingPackageAction}
      className="grid gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/40 p-3 [&_input]:min-w-0 [&_input]:w-full"
    >
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="currency" value="IRR" />
      <input type="hidden" name="sortOrder" value={defaultSortOrder} />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted">نام نمایشی</span>
          <input
            name="title"
            placeholder={isSubscription ? "مثلا استارتر" : "مثلا ۱۰ اعتبار اضافه"}
            className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none"
          />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted">توضیح کوتاه برای کاربر</span>
          <input
            name="description"
            placeholder="این متن در صفحه حساب نمایش داده می‌شود"
            className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted">{isSubscription ? "تعداد خروجی در ماه" : "تعداد اعتبار"}</span>
          <input
            name="credits"
            type="number"
            min={0}
            placeholder={isSubscription ? "مثلا ۲۰" : "مثلا ۱۰"}
            className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none"
          />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted">قیمت به ریال</span>
          <input
            name="priceAmount"
            type="number"
            min={0}
            placeholder="مثلا 59000000"
            className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none"
          />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-medium text-muted">مدت دوره</span>
          <input
            name="periodDays"
            type="number"
            min={1}
            defaultValue={isSubscription ? 30 : 1}
            disabled={!isSubscription}
            className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none disabled:opacity-50"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-xs text-muted">
          <input name="isActive" type="checkbox" defaultChecked className="accent-[#b28b52]" />
          فعال و قابل نمایش در حساب کاربر
        </label>
        <Button type="submit" size="sm">
          <Save className="h-4 w-4" />
          ساخت
        </Button>
      </div>
    </form>
  );
}

function PackageEditor({ billingPackage }: { billingPackage: PackageWithCounts }) {
  const isSubscription = billingPackage.type === "SUBSCRIPTION";

  return (
    <form
      action={updateBillingPackageAction}
      className="rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/35 p-3 [&_input]:min-w-0 [&_input]:w-full"
    >
      <input type="hidden" name="packageId" value={billingPackage.id} />
      <input type="hidden" name="type" value={billingPackage.type} />
      <input type="hidden" name="currency" value={billingPackage.currency} />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid min-w-0 gap-1.5">
          <span className="text-[11px] text-muted">نام</span>
          <input name="title" defaultValue={billingPackage.title} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-[11px] text-muted">توضیح</span>
          <input name="description" defaultValue={billingPackage.description} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-[11px] text-muted">{isSubscription ? "خروجی ماهانه" : "اعتبار"}</span>
          <input name="credits" type="number" min={0} defaultValue={billingPackage.credits} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-[11px] text-muted">قیمت ریالی</span>
          <input name="priceAmount" type="number" min={0} defaultValue={billingPackage.priceAmount} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-[11px] text-muted">روز</span>
          <input
            name="periodDays"
            type="number"
            min={1}
            defaultValue={billingPackage.periodDays ?? 30}
            disabled={!isSubscription}
            className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none disabled:opacity-50"
          />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-[11px] text-muted">ترتیب</span>
          <input name="sortOrder" type="number" defaultValue={billingPackage.sortOrder} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
        </label>
      </div>

      <div className="mt-3 grid gap-3 rounded-[var(--radius-sm)] bg-surface/60 p-2 md:grid-cols-2">
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <label className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2">
            <input name="isActive" type="checkbox" defaultChecked={billingPackage.isActive} className="accent-[#b28b52]" />
            فعال و قابل نمایش
          </label>
          <span className="self-center">{formatIrr(billingPackage.priceAmount, billingPackage.currency)}</span>
        </div>
        <p className="self-center text-xs text-muted">
          {billingPackage._count.purchaseRequests.toLocaleString("fa-IR")} درخواست ·{" "}
          {billingPackage._count.subscriptions.toLocaleString("fa-IR")} اشتراک
        </p>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" size="sm">
            <Save className="h-4 w-4" />
            ذخیره
          </Button>
          <button formAction={duplicateBillingPackageAction} className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs">
            <Copy className="h-3.5 w-3.5" />
            کپی
          </button>
          <button formAction={deleteBillingPackageAction} className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] border border-danger/30 bg-danger-soft px-3 text-xs text-danger">
            <Trash2 className="h-3.5 w-3.5" />
            حذف
          </button>
        </div>
      </div>
    </form>
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

export default async function AdminPackagesPage() {
  const [packages, paymentSettings, pendingCount] = await Promise.all([
    getPackages(),
    db.paymentSettings.findUnique({ where: { id: "default" } }),
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
  ]);
  const subscriptions = packages.filter((item) => item.type === "SUBSCRIPTION");
  const creditPacks = packages.filter((item) => item.type === "CREDIT_PACK");

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <AdminMetric label="پکیج فعال" value={subscriptions.filter((item) => item.isActive).length} />
        <AdminMetric label="اعتبار فعال" value={creditPacks.filter((item) => item.isActive).length} />
        <AdminMetric label="رسید در انتظار" value={pendingCount} />
      </section>

      <AdminSection title="پرداخت کارت‌به‌کارت" eyebrow="اطلاعات قابل نمایش در حساب کاربر" action={<CreditCard className="h-4 w-4 text-accent" />}>
        <form action={updatePaymentSettingsAction} className="grid gap-3 md:grid-cols-2 [&_input]:min-w-0 [&_input]:w-full">
          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-medium text-muted">نام صاحب کارت</span>
            <input name="cardholderName" defaultValue={paymentSettings?.cardholderName ?? ""} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-medium text-muted">شماره کارت</span>
            <input name="cardNumber" defaultValue={paymentSettings?.cardNumber ?? ""} dir="ltr" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-left text-sm outline-none" />
          </label>
          <label className="grid min-w-0 gap-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted">توضیح پرداخت</span>
            <textarea name="instructions" defaultValue={paymentSettings?.instructions ?? ""} rows={3} className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm outline-none" />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
            <label className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-xs text-muted">
              <input name="isActive" type="checkbox" defaultChecked={paymentSettings?.isActive ?? true} className="accent-[#b28b52]" />
              نمایش کارت‌به‌کارت به کاربر
            </label>
            <Button type="submit" size="sm">
              <Save className="h-4 w-4" />
              ذخیره اطلاعات پرداخت
            </Button>
          </div>
        </form>
      </AdminSection>

      <div className="space-y-4">
        <AdminSection title="پکیج‌ها" eyebrow="اشتراک ماهانه؛ اعتبار هر دوره جدا محاسبه می‌شود">
          <div className="space-y-3">
            <PackageForm type="SUBSCRIPTION" defaultSortOrder={(subscriptions.length + 1) * 10} />
            {subscriptions.length === 0 ? (
              <EmptyAdminState>پکیجی ثبت نشده است.</EmptyAdminState>
            ) : (
              subscriptions.map((item) => <PackageEditor key={item.id} billingPackage={item} />)
            )}
          </div>
        </AdminSection>

        <AdminSection title="اعتبارهای جداگانه" eyebrow="اختیاری؛ به موجودی کاربر اضافه می‌شود و جدا از پکیج ماهانه است">
          <div className="space-y-3 rounded-[var(--radius-md)] border border-dashed border-border-strong/70 bg-surface-soft/55 p-3">
            <PackageForm type="CREDIT_PACK" defaultSortOrder={(creditPacks.length + 1) * 10 + 100} />
            {creditPacks.length === 0 ? (
              <EmptyAdminState>اعتبار جداگانه‌ای ثبت نشده است.</EmptyAdminState>
            ) : (
              creditPacks.map((item) => <PackageEditor key={item.id} billingPackage={item} />)
            )}
          </div>
        </AdminSection>
      </div>
    </>
  );
}
