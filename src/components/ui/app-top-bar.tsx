import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn } from "@/lib/utils/cn";

type AppTopBarProps = {
  title?: ReactNode;
  backHref?: string;
  logoHref?: string;
  logoVariant?:
    | "logo"
    | "mark"
    | "mark-light"
    | "wordmark"
    | "horizontal"
    | "primary"
    | "primary-light"
    | "primary-dark";
  centeredLogo?: boolean;
  hideLogo?: boolean;
  tone?: "light" | "dark";
  framed?: boolean;
  action?: ReactNode;
  onBack?: () => void;
  className?: string;
};

export function AppTopBar({
  title,
  backHref,
  logoHref = "/dashboard",
  logoVariant = "wordmark",
  centeredLogo = false,
  hideLogo = false,
  tone = "light",
  action,
  onBack,
  className,
}: AppTopBarProps) {
  const isDark = tone === "dark";
  const backClass = isDark
    ? "bg-white/10 border border-white/20 text-white hover:bg-white/15 shadow-[var(--shadow-xs)]"
    : "bg-surface border border-border text-ink-2";
  const titleClass = isDark ? "text-white" : "text-ink-1";

  if (centeredLogo) {
    return (
      <header
        className={cn(
          "relative flex h-16 items-center justify-center",
          className,
        )}
      >
        {action ? (
          <div className="absolute end-2 top-1/2 -translate-y-1/2">{action}</div>
        ) : null}
        <Link href={logoHref} aria-label="OVALA Studio" className="inline-flex">
          <BrandLogo variant={logoVariant} priority />
        </Link>
      </header>
    );
  }

  const backButton = backHref || onBack ? (
    onBack ? (
      <button
        type="button"
        onClick={onBack}
        aria-label="بازگشت"
        className={cn(
          "ov-press inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-pill)]",
          backClass,
        )}
      >
        <ChevronRight aria-hidden className="h-4.5 w-4.5" strokeWidth={2.2} />
      </button>
    ) : (
      <Link
        href={backHref as string}
        aria-label="بازگشت"
        className={cn(
          "ov-press inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-pill)]",
          backClass,
        )}
      >
        <ChevronRight aria-hidden className="h-4.5 w-4.5" strokeWidth={2.2} />
      </Link>
    )
  ) : null;

  return (
    <header
      dir="ltr"
      className={cn(
        "flex min-h-14 items-center justify-between gap-3 py-3",
        isDark && "border-b border-white/5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {!hideLogo ? (
          <Link
            href={logoHref}
            aria-label="OVALA Studio"
            className="inline-flex h-10 w-28 items-center justify-start"
          >
            <BrandLogo variant={logoVariant} />
          </Link>
        ) : null}
      </div>

      <div dir="rtl" className="flex min-w-0 flex-1 items-center justify-start gap-2 ps-2">
        {backButton}
        {action}
        {title ? (
          <h1 className={cn("min-w-0 truncate text-[15px] font-bold", titleClass)}>
            {title}
          </h1>
        ) : null}
      </div>
    </header>
  );
}

// Hidden helper to keep imports tidy
export const _ChevronLeft = ChevronLeft;
