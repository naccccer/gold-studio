import type { ComponentType, ReactNode } from "react";
import { fieldControlClassName, fieldTextAreaClassName } from "@/components/ui/field";
import { PageShell } from "@/components/ui/page-shell";

type SectionIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

type AccountSubpageProps = {
  title?: string;
  caption?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function AccountSubpage({ children }: AccountSubpageProps) {
  return <PageShell maxWidth="md" className="space-y-3 pb-28">{children}</PageShell>;
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
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-champagne-50 text-champagne-700">
        <Icon aria-hidden={true} className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink-1">{title}</h2>
        {caption ? <p className="mt-1 text-xs leading-6 text-ink-3">{caption}</p> : null}
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
    <div className="flex items-center justify-between gap-3 rounded-[var(--r-md)] border border-border-hairline bg-surface-soft/72 px-3 py-2.5">
      <span className="text-[11px] text-ink-3">{label}</span>
      <span className={["text-sm font-semibold text-ink-1", valueClassName].filter(Boolean).join(" ")}>{value}</span>
    </div>
  );
}

export const accountInputClass = `${fieldControlClassName} h-11 bg-surface`;

export const accountTextareaClass = `${fieldTextAreaClassName} min-h-28 bg-surface`;

export const accountCardClass =
  "rounded-[var(--r-lg)] border border-border-hairline bg-surface/92 p-3.5 text-right shadow-[var(--shadow-sm)]";

export const accountMutedCardClass = "rounded-[var(--r-md)] border border-border-hairline bg-surface-soft/68 p-3 text-right";
