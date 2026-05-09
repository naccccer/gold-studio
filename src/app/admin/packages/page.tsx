import { Archive, Copy, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminMetric, AdminRow, AdminSection, EmptyAdminState, formatIrr } from "@/features/admin/components/admin-ui";
import {
  archiveBillingPackageAction,
  createBillingPackageAction,
  duplicateBillingPackageAction,
  updateBillingPackageAction,
} from "@/features/admin/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const [packages, activeCount, publicCount, pendingCount] = await Promise.all([
    db.billingPackage.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { purchaseRequests: true, subscriptions: true } },
      },
    }),
    db.billingPackage.count({ where: { isActive: true, archivedAt: null } }),
    db.billingPackage.count({ where: { isPublic: true, archivedAt: null } }),
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <AdminMetric label="بسته فعال" value={activeCount} />
        <AdminMetric label="نمایش عمومی" value={publicCount} />
        <AdminMetric label="درخواست در انتظار" value={pendingCount} />
      </section>

      <AdminSection title="ساخت بسته جدید" eyebrow="اعتبار یا اشتراک">
        <form action={createBillingPackageAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_110px_110px_110px_auto]">
          <input name="title" placeholder="نام بسته" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          <input name="description" placeholder="توضیح کوتاه" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          <select name="type" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm outline-none">
            <option value="CREDIT_PACK">بسته اعتبار</option>
            <option value="SUBSCRIPTION">اشتراک</option>
          </select>
          <input name="priceAmount" type="number" min={0} placeholder="قیمت" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          <input name="credits" type="number" min={0} placeholder="اعتبار" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          <Button type="submit" size="sm">
            <Save className="h-4 w-4" />
            ساخت
          </Button>
          <input name="periodDays" type="number" min={1} defaultValue={30} aria-label="روزهای دوره" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          <input name="currency" defaultValue="IRR" dir="ltr" aria-label="واحد پول" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-left text-sm outline-none" />
          <input name="sortOrder" type="number" defaultValue={packages.length * 10 + 10} aria-label="ترتیب" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          <label className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs text-muted">
            <input name="isActive" type="checkbox" defaultChecked className="accent-[#b28b52]" />
            فعال
          </label>
          <label className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs text-muted">
            <input name="isPublic" type="checkbox" defaultChecked className="accent-[#b28b52]" />
            عمومی
          </label>
        </form>
      </AdminSection>

      <AdminSection title="بسته‌ها و اشتراک‌ها" eyebrow="مدیریت پیشنهادهای خرید">
        {packages.length === 0 ? (
          <EmptyAdminState>هنوز بسته‌ای ساخته نشده است.</EmptyAdminState>
        ) : (
          <div className="space-y-3">
            {packages.map((billingPackage) => (
              <form
                key={billingPackage.id}
                action={updateBillingPackageAction}
                className="rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/35 p-3"
              >
                <input type="hidden" name="packageId" value={billingPackage.id} />
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_120px_110px_110px_90px]">
                  <input name="title" defaultValue={billingPackage.title} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
                  <input name="description" defaultValue={billingPackage.description} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
                  <select name="type" defaultValue={billingPackage.type} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm outline-none">
                    <option value="CREDIT_PACK">بسته اعتبار</option>
                    <option value="SUBSCRIPTION">اشتراک</option>
                  </select>
                  <input name="priceAmount" type="number" min={0} defaultValue={billingPackage.priceAmount} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
                  <input name="credits" type="number" min={0} defaultValue={billingPackage.credits} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
                  <input name="sortOrder" type="number" defaultValue={billingPackage.sortOrder} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
                  <input name="periodDays" type="number" min={1} defaultValue={billingPackage.periodDays ?? 30} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
                  <input name="currency" defaultValue={billingPackage.currency} dir="ltr" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-left text-sm outline-none" />
                  <label className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs text-muted">
                    <input name="isActive" type="checkbox" defaultChecked={billingPackage.isActive} className="accent-[#b28b52]" />
                    فعال
                  </label>
                  <label className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs text-muted">
                    <input name="isPublic" type="checkbox" defaultChecked={billingPackage.isPublic} className="accent-[#b28b52]" />
                    عمومی
                  </label>
                  <Button type="submit" size="sm">
                    <Save className="h-4 w-4" />
                    ذخیره
                  </Button>
                </div>
                <AdminRow className="mt-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <p className="text-xs text-muted">
                    {billingPackage.type === "SUBSCRIPTION" ? "اشتراک" : "بسته اعتبار"} · {formatIrr(billingPackage.priceAmount, billingPackage.currency)}
                  </p>
                  <p className="text-xs text-muted">
                    {billingPackage.credits.toLocaleString("fa-IR")} اعتبار · {billingPackage._count.purchaseRequests.toLocaleString("fa-IR")} درخواست · {billingPackage._count.subscriptions.toLocaleString("fa-IR")} اشتراک
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button formAction={duplicateBillingPackageAction} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs">
                      <Copy className="h-3.5 w-3.5" />
                      کپی
                    </button>
                    <button
                      formAction={archiveBillingPackageAction}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-danger/30 bg-danger-soft px-3 text-xs text-danger"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      آرشیو
                    </button>
                  </div>
                </AdminRow>
              </form>
            ))}
          </div>
        )}
      </AdminSection>
    </>
  );
}
