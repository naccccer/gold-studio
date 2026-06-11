import {
  adminInputClass,
  adminPrimaryActionClass,
  adminTableCellClass,
  adminTextareaClass,
  AdminDataTable,
  AdminEmptyState,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
} from "@/features/admin/components/admin-ui";
import { createFaqItemAction, updateFaqItemAction } from "@/features/admin/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const faqs = await db.faqItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const activeCount = faqs.filter((item) => item.isActive).length;

  return (
    <>
      <AdminPageHeader title="FAQ" description="سوالات پرتکرار نمایش‌داده‌شده در حساب کاربر." />

      <AdminKpiStrip>
        <AdminKpi label="کل FAQ" value={faqs.length} />
        <AdminKpi label="فعال" value={activeCount} />
        <AdminKpi label="پنهان" value={faqs.length - activeCount} />
      </AdminKpiStrip>

      <AdminPanel title="افزودن سوال">
        <form action={createFaqItemAction} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_120px_auto] md:items-end">
          <input name="question" placeholder="سوال" className={adminInputClass} />
          <input name="sortOrder" type="number" defaultValue={10} className={adminInputClass} />
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-950">
            <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-slate-950" />
            فعال
          </label>
          <textarea name="answer" placeholder="پاسخ" className={`${adminTextareaClass} md:col-span-3`} />
          <button className={`${adminPrimaryActionClass} md:col-span-3`}>افزودن FAQ</button>
        </form>
      </AdminPanel>

      <AdminPanel title="لیست FAQ">
        <AdminDataTable headers={["سوال و پاسخ", "ترتیب", "وضعیت", "عملیات"]} empty={<AdminEmptyState title="FAQ ثبت نشده است." />}>
          {faqs.map((faq) => (
            <tr key={faq.id}>
              <td className={adminTableCellClass}>
                <form id={`faq-${faq.id}`} action={updateFaqItemAction} className="grid gap-2">
                  <input type="hidden" name="faqId" value={faq.id} />
                  <input name="question" defaultValue={faq.question} className={adminInputClass} />
                  <textarea name="answer" defaultValue={faq.answer} className={adminTextareaClass} />
                </form>
              </td>
              <td className={adminTableCellClass}>
                <input form={`faq-${faq.id}`} name="sortOrder" type="number" defaultValue={faq.sortOrder} className={adminInputClass} />
              </td>
              <td className={adminTableCellClass}>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input form={`faq-${faq.id}`} name="isActive" type="checkbox" defaultChecked={faq.isActive} className="h-4 w-4 accent-slate-950" />
                  <AdminStatus status={faq.isActive ? "ACTIVE" : "PAUSED"} />
                </label>
              </td>
              <td className={adminTableCellClass}>
                <button form={`faq-${faq.id}`} className={adminPrimaryActionClass}>ذخیره FAQ</button>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>
    </>
  );
}
