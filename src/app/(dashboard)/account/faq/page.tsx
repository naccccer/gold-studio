import { HelpCircle } from "lucide-react";
import { AccountSectionHeader, AccountSubpage, accountCardClass } from "@/features/account/components/account-subpage";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountFaqPage() {
  const items = await db.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <AccountSubpage title="سوالات پرتکرار">
      <section className="space-y-2.5">
        <div className="px-1">
          <AccountSectionHeader icon={HelpCircle} title="راهنما" />
        </div>
        {items.length === 0 ? (
          <p className={`${accountCardClass} text-xs leading-6 text-ink-3`}>موردی نیست.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className={accountCardClass}>
              <h2 className="text-sm font-semibold leading-6 text-ink-1">{item.question}</h2>
              <p className="mt-1 text-xs leading-6 text-ink-3">{item.answer}</p>
            </article>
          ))
        )}
      </section>
    </AccountSubpage>
  );
}
