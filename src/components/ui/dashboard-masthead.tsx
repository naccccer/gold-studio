"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Coin } from "vuesax-icons-react";
import { AppTopBar } from "@/components/ui/app-top-bar";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";

type DashboardMastheadProps = {
  userLabel: string;
  remainingCredits: number;
};

const titles: Array<{ match: (pathname: string) => boolean; title: string; parent?: string }> = [
  { match: (pathname) => pathname === "/projects/new", title: "ابعاد و نوع محصول", parent: "/gallery" },
  { match: (pathname) => pathname.startsWith("/gallery/batches/"), title: "دسته تولید", parent: "/gallery" },
  { match: (pathname) => pathname === "/gallery/crop", title: "کراپ", parent: "/gallery" },
  { match: (pathname) => /^\/gallery\/[^/]+$/.test(pathname), title: "تصویر خام", parent: "/gallery" },
  { match: (pathname) => pathname.startsWith("/gallery"), title: "گالری" },
  { match: (pathname) => /^\/projects\/[^/]+$/.test(pathname), title: "نتیجه", parent: "/projects" },
  { match: (pathname) => pathname === "/projects", title: "پروژه‌ها" },
  { match: (pathname) => pathname === "/account/profile", title: "حساب کاربری", parent: "/account" },
  { match: (pathname) => pathname === "/account/style-references", title: "گالری نمونه‌ها", parent: "/account" },
  { match: (pathname) => pathname === "/account/referral", title: "کد معرفی", parent: "/account" },
  { match: (pathname) => pathname === "/account/security", title: "حساب کاربری", parent: "/account" },
  { match: (pathname) => pathname === "/account/support", title: "پشتیبانی", parent: "/account" },
  { match: (pathname) => pathname === "/account/faq", title: "سوالات پرتکرار", parent: "/account" },
  { match: (pathname) => pathname === "/account/output-settings", title: "تنظیمات خروجی", parent: "/account" },
  { match: (pathname) => pathname === "/account/archive", title: "آرشیو", parent: "/account" },
  { match: (pathname) => pathname === "/account", title: "حساب" },
  { match: (pathname) => pathname === "/billing", title: "پلن‌ها", parent: "/account" },
  { match: () => true, title: "خانه" },
];

function pageContext(pathname: string) {
  return titles.find((item) => item.match(pathname)) ?? titles[titles.length - 1];
}

function CreditBadge({ credits }: { credits: number }) {
  return (
    <Link
      href="/billing"
      aria-label={`اعتبار باقی‌مانده: ${credits.toLocaleString("fa-IR")}`}
      className="inline-flex h-10 shrink-0 items-center rounded-full border border-border bg-surface/70 px-3 text-xs font-semibold text-foreground shadow-[var(--shadow-soft)] transition hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
    >
      <span className="leading-none">{credits.toLocaleString("fa-IR")}</span>
      <Coin aria-hidden={true} className="mr-1.5 h-3.5 w-3.5 text-muted" />
    </Link>
  );
}

export function DashboardMasthead({ userLabel, remainingCredits }: DashboardMastheadProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const context = pageContext(pathname);
  const isHome = pathname === "/dashboard";
  const isStudioWizard = pathname === "/projects/new" || pathname === "/gallery/batches/new";
  const isProjectDarkSurface = isStudioWizard || pathname.startsWith("/gallery/batches/") || /^\/projects\/[^/]+$/.test(pathname);
  const showBottomNav = !isProjectDarkSurface;
  const fromBatch = searchParams.get("fromBatch");
  const backHref = fromBatch && /^\/projects\/[^/]+$/.test(pathname) ? `/gallery/batches/${fromBatch}` : context.parent;

  return (
    <>
      {!isStudioWizard ? (
        <AppTopBar
          title={undefined}
          backHref={backHref}
          centeredLogo={isHome}
          framed={!isHome}
          logoVariant={isHome ? "primary" : isProjectDarkSurface ? "mark-light" : "logo"}
          tone={isProjectDarkSurface ? "dark" : "light"}
          action={!isHome && !isProjectDarkSurface ? <CreditBadge credits={remainingCredits} /> : undefined}
          className={isHome ? "mb-4 px-4" : isProjectDarkSurface ? "mx-4 mb-3" : "mx-4 mb-4"}
        />
      ) : null}

      <span className="sr-only">{userLabel}</span>

      {showBottomNav ? (
        <MobileTabBar
          tabs={[
            { href: "/dashboard", label: "خانه", icon: "home", match: "exact" },
            { href: "/gallery", label: "گالری", icon: "gallery" },
            { href: "/projects", label: "پروژه‌ها", icon: "projects" },
            { href: "/account", label: "حساب", icon: "account", match: "exact" },
          ]}
          centerAction={{ href: "/projects/new", label: "پروژه جدید" }}
        />
      ) : null}
    </>
  );
}
