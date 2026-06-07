import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type ListRowProps = {
  href?: string;
  onClick?: () => void;
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  meta?: ReactNode;
  selected?: boolean;
  className?: string;
};

export function ListRow({
  href,
  onClick,
  leading,
  title,
  description,
  trailing,
  meta,
  selected,
  className,
}: ListRowProps) {
  const content = (
    <>
      {leading ? (
        <div className="shrink-0">{leading}</div>
      ) : null}
      <div className="min-w-0 flex-1 text-right">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[14px] font-semibold text-ink-1">{title}</p>
          {meta ? <div className="shrink-0 text-[11px] text-ink-3">{meta}</div> : null}
        </div>
        {description ? (
          <p className="mt-0.5 truncate text-[12px] text-ink-3">{description}</p>
        ) : null}
      </div>
      {trailing ? (
        <div className="shrink-0 text-ink-3">{trailing}</div>
      ) : (
        <ChevronLeft aria-hidden className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={2} />
      )}
    </>
  );

  const baseClass = cn(
    "ov-press grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3",
    "min-h-[3.75rem] rounded-[var(--r-lg)] border bg-surface px-3.5 py-3",
    selected ? "border-champagne-400" : "border-border",
    "hover:border-border-strong hover:bg-surface-soft",
    "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={baseClass} dir="rtl">
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={baseClass} dir="rtl">
      {content}
    </button>
  );
}
