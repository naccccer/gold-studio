import { CircleHelp } from "lucide-react";
import { AccountSubpage, accountCardClass } from "@/features/account/components/account-subpage";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountFaqPage() {
  const items = await db.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <AccountSubpage title="سوالات پرتکرار" caption="پاسخ‌های کوتاه درباره پرداخت، اعتبار و ساخت خروجی.">
      <section className="space-y-2.5">
        {items.length === 0 ? (
          <p className={`${accountCardClass} text-xs leading-6 text-muted`}>هنوز سوالی ثبت نشده است.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className={accountCardClass}>
              <div className="flex items-start gap-2">
                <CircleHelp aria-hidden={true} className="mt-0.5 h-4 w-4 shrink-0 text-[#8b6835]" />
                <div>
                  <h2 className="text-sm font-semibold leading-6 text-foreground">{item.question}</h2>
                  <p className="mt-1 text-xs leading-6 text-muted">{item.answer}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </AccountSubpage>
  );
}
