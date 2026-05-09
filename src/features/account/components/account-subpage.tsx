import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";

export function AccountSubpage({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <PageShell maxWidth="md" className="space-y-3 pb-3">
      <header className="rounded-[1.35rem] border border-white/80 bg-surface/62 p-3.5 shadow-[0_22px_50px_-44px_rgba(17,16,14,0.72)]">
        <ButtonLink href="/account" variant="ghost" size="sm" className="h-9 w-fit rounded-full px-2.5">
          <ArrowRight aria-hidden={true} className="h-4 w-4" />
          حساب
        </ButtonLink>
        <h1 className="mt-3 text-xl font-semibold leading-8 text-foreground">{title}</h1>
        <p className="mt-1 text-xs leading-6 text-muted">{caption}</p>
      </header>
      {children}
    </PageShell>
  );
}

export const accountInputClass =
  "h-11 w-full rounded-[0.95rem] border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-border-strong focus:shadow-[var(--shadow-focus)]";

export const accountTextareaClass =
  "min-h-28 w-full rounded-[0.95rem] border border-border bg-white px-3 py-2 text-sm leading-7 text-foreground outline-none transition focus:border-border-strong focus:shadow-[var(--shadow-focus)]";

export const accountCardClass = "rounded-[1.05rem] border border-white/72 bg-surface/64 p-3 text-right";
