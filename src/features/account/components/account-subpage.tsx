import type { ComponentType, ReactNode } from "react";
import { ArrowRight2 } from "vuesax-icons-react";
import { fieldControlClassName, fieldTextAreaClassName } from "@/components/ui/field";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";

type SectionIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

type AccountSubpageProps = {
  title: string;
  caption?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function AccountSubpage({ children }: AccountSubpageProps) {
  return (
    <PageShell maxWidth="md" className="space-y-3 pb-28">
      <header className="motion-reveal-soft rounded-[1.35rem] border border-white/80 bg-surface/62 p-3.5 shadow-[0_22px_50px_-44px_rgba(17,16,14,0.72)]">
        <ButtonLink href="/account" variant="secondary" size="sm" className="h-10 w-fit rounded-full px-3">
          <ArrowRight2 aria-hidden={true} className="h-4 w-4" />
          حساب
        </ButtonLink>
      </header>
      {children}
    </PageShell>
  );
}

export function AccountSectionHeader({
  icon: Icon,
  title,
  caption,
  align = "right",
}: {
  icon: SectionIcon;
  title: string;
  caption?: string;
  align?: "right" | "center";
}) {
  const rightAlignment = caption ? "items-start text-right" : "items-center text-right";

  return (
    <div className={["flex gap-3", align === "center" ? "flex-col items-center text-center" : rightAlignment].join(" ")}>
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
        <Icon aria-hidden={true} className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {caption ? <p className="mt-1 text-xs leading-6 text-muted">{caption}</p> : null}
      </div>
    </div>
  );
}

export function AccountInfoRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="motion-state flex items-center justify-between gap-3 rounded-[0.95rem] bg-white/62 px-3 py-2.5">
      <span className="text-[11px] text-muted">{label}</span>
      <span className={["text-sm font-semibold text-foreground", valueClassName].filter(Boolean).join(" ")}>{value}</span>
    </div>
  );
}

export const accountInputClass = `${fieldControlClassName} h-11 bg-white/88`;

export const accountTextareaClass = `${fieldTextAreaClassName} min-h-28 bg-white/88`;

export const accountCardClass =
  "motion-surface motion-reveal-soft rounded-[1.05rem] border border-white/72 bg-surface/64 p-3.5 text-right shadow-[0_18px_42px_-42px_rgba(17,16,14,0.7)]";

export const accountMutedCardClass = "motion-state rounded-[1rem] border border-white/60 bg-white/58 p-3 text-right";
