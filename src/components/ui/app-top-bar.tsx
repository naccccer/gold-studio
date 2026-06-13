import Link from "next/link";
import { ArrowRight2 } from "vuesax-icons-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";

type AppTopBarProps = {
  title?: ReactNode;
  backHref?: string;
  logoHref?: string;
  logoVariant?: "logo" | "mark" | "mark-light" | "wordmark" | "horizontal" | "primary" | "primary-light" | "primary-dark";
  centeredLogo?: boolean;
  hideLogo?: boolean;
  tone?: "light" | "dark";
  action?: ReactNode;
  onBack?: () => void;
  framed?: boolean;
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
  framed = false,
  className = "",
}: AppTopBarProps) {
  const dark = tone === "dark";
  const frameClassName = framed
    ? dark
      ? "rounded-[1.45rem] bg-transparent py-0"
      : "rounded-[1.45rem] bg-transparent py-0"
    : "";
  const logoLinkClassName = [
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    dark
      ? "border-white/12 bg-white/[0.04] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.92)] hover:bg-white/[0.08]"
      : "border-border bg-surface/64 shadow-[var(--shadow-soft)] hover:bg-surface",
  ].filter(Boolean).join(" ");
  const framelessLogoLinkClassName =
    "inline-flex h-12 w-28 shrink-0 items-center justify-start overflow-visible transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]";

  if (centeredLogo) {
    return (
      <header className={["relative mb-1 flex h-16 items-center justify-center overflow-hidden", frameClassName, className].filter(Boolean).join(" ")}>
        {action ? <div className="absolute right-0 top-1/2 -translate-y-1/2">{action}</div> : null}
        <Link href={logoHref} aria-label="OVALA Studio" className="inline-flex">
          <BrandLogo variant={logoVariant} priority />
        </Link>
      </header>
    );
  }

  if (framed) {
    return (
      <header
        dir="ltr"
        className={["mb-4 flex min-h-14 items-center justify-between gap-3", frameClassName, className]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex shrink-0 items-center justify-start overflow-visible">
          {!hideLogo ? (
            <Link href={logoHref} aria-label="OVALA Studio" className={framelessLogoLinkClassName}>
              <BrandLogo variant={logoVariant} />
            </Link>
          ) : null}
        </div>

        <div dir="rtl" className="ml-auto flex shrink-0 items-center justify-end gap-2 overflow-visible">
          {backHref || onBack ? (
            onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="بازگشت"
                className={[
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                  dark
                    ? "border-white/12 bg-white/[0.04] text-white/72 hover:bg-white/[0.08] hover:text-white"
                    : "border-border bg-surface/70 text-muted shadow-[var(--shadow-soft)] hover:bg-surface-soft hover:text-foreground",
                ].join(" ")}
              >
                <ArrowRight2 aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href={backHref as string}
                aria-label="بازگشت"
                className={[
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                  dark
                    ? "border-white/12 bg-white/[0.04] text-white/72 hover:bg-white/[0.08] hover:text-white"
                    : "border-border bg-surface/70 text-muted shadow-[var(--shadow-soft)] hover:bg-surface-soft hover:text-foreground",
                ].join(" ")}
              >
                <ArrowRight2 aria-hidden="true" className="h-4 w-4" />
              </Link>
            )
          ) : null}
          {action}
        </div>
      </header>
    );
  }

  return (
    <header dir="ltr" className={["mb-4 flex min-h-14 items-center justify-between gap-3", frameClassName, className].filter(Boolean).join(" ")}>
      <div dir="rtl" className="flex shrink-0 items-center gap-2">
        {action}
        {!hideLogo ? (
          <Link href={logoHref} aria-label="OVALA Studio" className={logoLinkClassName}>
            <BrandLogo variant={logoVariant} />
          </Link>
        ) : null}
      </div>

      <div dir="rtl" className="flex min-w-0 flex-1 items-center justify-start gap-2 overflow-visible">
        {backHref || onBack ? (
          onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="بازگشت"
              className={[
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                dark
                  ? "border-white/12 bg-white/[0.04] text-white/72 hover:bg-white/[0.08] hover:text-white"
                  : "border-border bg-surface/70 text-muted shadow-[var(--shadow-soft)] hover:bg-surface-soft hover:text-foreground",
              ].join(" ")}
            >
              <ArrowRight2 aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={backHref as string}
              aria-label="بازگشت"
              className={[
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                dark
                  ? "border-white/12 bg-white/[0.04] text-white/72 hover:bg-white/[0.08] hover:text-white"
                  : "border-border bg-surface/70 text-muted shadow-[var(--shadow-soft)] hover:bg-surface-soft hover:text-foreground",
              ].join(" ")}
            >
              <ArrowRight2 aria-hidden="true" className="h-4 w-4" />
            </Link>
          )
        ) : null}
        {title ? (
          <h1 className={["min-w-0 truncate pb-1 text-[17px] font-semibold leading-6", dark ? "!text-[#fffdf9]" : "!text-foreground"].join(" ")}>
            {title}
          </h1>
        ) : null}
      </div>
    </header>
  );
}
