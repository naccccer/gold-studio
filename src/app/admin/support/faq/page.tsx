import { Add, Save2 } from "vuesax-icons-react";
import {
  btnPrimary,
  checkboxClass,
  ConsoleHeader,
  Disclosure,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  StatusDot,
  Surface,
  textareaClass,
} from "@/features/admin/components/console";
import { createFaqItemAction, updateFaqItemAction } from "@/features/admin/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const faqs = await db.faqItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const activeCount = faqs.filter((item) => item.isActive).length;

  return (
    <>
      <ConsoleHeader
        backHref="/admin/support"
        backLabel="پشتیبانی"
        title="پرسش‌های پرتکرار"
        meta={<span>{faNum(activeCount)} فعال از {faNum(faqs.length)}</span>}
      />

      {faqs.length === 0 ? (
        <Surface className="p-8">
          <EmptyState title="هنوز پرسشی ثبت نشده است." />
        </Surface>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {faqs.map((faq) => (
            <Disclosure
              key={faq.id}
              flush
              summary={
                <>
                  <StatusDot status={faq.isActive ? "ACTIVE" : "PAUSED"} label="" />
                  <span className="truncate font-medium text-navy-950">{faq.question}</span>
                </>
              }
            >
              <form action={updateFaqItemAction} className="grid gap-3">
                <input type="hidden" name="faqId" value={faq.id} />
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_100px]">
                  <Field label="سوال">
                    <input name="question" required defaultValue={faq.question} className={fieldClass} />
                  </Field>
                  <Field label="ترتیب">
                    <input name="sortOrder" type="number" defaultValue={faq.sortOrder} className={fieldClass} />
                  </Field>
                </div>
                <Field label="پاسخ">
                  <textarea name="answer" required defaultValue={faq.answer} className={textareaClass} />
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-navy-900">
                    <input name="isActive" type="checkbox" defaultChecked={faq.isActive} className={checkboxClass} />
                    در حساب کاربر نمایش داده شود
                  </label>
                  <button className={btnPrimary}>
                    <Save2 className="h-4 w-4" />
                    ذخیره
                  </button>
                </div>
              </form>
            </Disclosure>
          ))}
        </div>
      )}

      <Disclosure
        summary={
          <>
            <Add className="h-4 w-4 text-slate-400" />
            افزودن پرسش جدید
          </>
        }
      >
        <form action={createFaqItemAction} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_100px]">
            <Field label="سوال">
              <input name="question" required className={fieldClass} />
            </Field>
            <Field label="ترتیب">
              <input name="sortOrder" type="number" defaultValue={(faqs.length + 1) * 10} className={fieldClass} />
            </Field>
          </div>
          <Field label="پاسخ">
            <textarea name="answer" required className={textareaClass} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-navy-900">
              <input name="isActive" type="checkbox" defaultChecked className={checkboxClass} />
              فعال باشد
            </label>
            <button className={btnPrimary}>
              <Add className="h-4 w-4" />
              افزودن
            </button>
          </div>
        </form>
      </Disclosure>
    </>
  );
}
