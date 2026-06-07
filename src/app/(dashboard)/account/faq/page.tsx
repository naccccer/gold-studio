import { HelpCircle } from "lucide-react";
import { AccountSubpage, accountCardClass } from "@/features/account/components/account-subpage";
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
        <div className="flex items-center gap-3 px-1">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
            <HelpCircle aria-hidden={true} className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">راهنما</h2>
        </div>
        {items.length === 0 ? (
          <p className={`${accountCardClass} text-xs leading-6 text-muted`}>موردی نیست.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className={accountCardClass}>
              <h2 className="text-sm font-semibold leading-6 text-foreground">{item.question}</h2>
              <p className="mt-1 text-xs leading-6 text-muted">{item.answer}</p>
            </article>
          ))
        )}
      </section>
    </AccountSubpage>
  );
}
