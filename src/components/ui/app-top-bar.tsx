import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";

type AppTopBarProps = {
  title?: ReactNode;
  backHref?: string;
  logoHref?: string;
  logoVariant?: "mark" | "mark-light" | "wordmark" | "horizontal" | "primary" | "primary-light" | "primary-dark";
  centeredLogo?: boolean;
  hideLogo?: boolean;
  tone?: "light" | "dark";
  action?: ReactNode;
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
  className = "",
}: AppTopBarProps) {
  const dark = tone === "dark";
  const logoLinkClassName = [
    "shrink-0 transition",
    dark ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.92)]" : "",
  ].filter(Boolean).join(" ");

  if (centeredLogo) {
    return (
      <header className={["relative mb-4 flex h-16 items-center justify-center overflow-hidden", className].filter(Boolean).join(" ")}>
        {action ? <div className="absolute right-0 top-1/2 -translate-y-1/2">{action}</div> : null}
        <Link href={logoHref} aria-label="OVALA Studio" className="inline-flex">
          <BrandLogo variant={logoVariant} priority />
        </Link>
      </header>
    );
  }

  return (
    <header className={["mb-5 flex min-h-10 items-center justify-between gap-4", className].filter(Boolean).join(" ")}>
      <div className="flex min-w-0 items-center justify-end gap-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="بازگشت"
            className={[
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition",
              dark
                ? "border-white/12 bg-white/[0.04] text-white/72 hover:bg-white/[0.08] hover:text-white"
                : "border-border bg-surface/54 text-muted hover:bg-surface-soft hover:text-foreground",
            ].join(" ")}
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
          </Link>
        ) : null}
        {title ? (
          <h1 className={["truncate text-[15px] font-semibold leading-none", dark ? "!text-[#fffdf9]" : "!text-foreground"].join(" ")}>
            {title}
          </h1>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {action}
        {!hideLogo ? (
          <Link href={logoHref} aria-label="OVALA Studio" className={logoLinkClassName}>
            <BrandLogo variant={logoVariant} />
          </Link>
        ) : null}
      </div>
    </header>
  );
}
