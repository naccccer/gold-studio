"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppTopBar } from "@/components/ui/app-top-bar";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";

type DashboardMastheadProps = {
  userLabel: string;
  remainingCredits: number;
};

const titles: Array<{ match: (pathname: string) => boolean; title: string; parent?: string }> = [
  { match: (pathname) => pathname === "/projects/new", title: "پروژه جدید", parent: "/dashboard" },
  { match: (pathname) => pathname.startsWith("/gallery/batches/"), title: "دسته تولید", parent: "/gallery" },
  { match: (pathname) => pathname === "/gallery/crop", title: "کراپ", parent: "/gallery" },
  { match: (pathname) => /^\/gallery\/[^/]+$/.test(pathname), title: "تصویر خام", parent: "/gallery" },
  { match: (pathname) => pathname.startsWith("/gallery"), title: "گالری" },
  { match: (pathname) => /^\/projects\/[^/]+$/.test(pathname), title: "نتیجه", parent: "/projects" },
  { match: (pathname) => pathname === "/projects", title: "پروژه‌ها" },
  { match: (pathname) => pathname === "/account", title: "حساب" },
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
      <span className="mr-1.5 text-[10px] font-medium leading-none text-muted">اعتبار</span>
    </Link>
  );
}

export function DashboardMasthead({ userLabel, remainingCredits }: DashboardMastheadProps) {
  const pathname = usePathname();
  const context = pageContext(pathname);
  const isHome = pathname === "/dashboard";
  const isProjectDarkSurface = pathname === "/projects/new" || /^\/projects\/[^/]+$/.test(pathname);
  const showBottomNav = !isProjectDarkSurface;

  return (
    <>
      <AppTopBar
        title={isHome ? undefined : context.title}
        backHref={context.parent}
        centeredLogo={isHome}
        logoVariant={isHome ? "primary" : isProjectDarkSurface ? "mark-light" : "mark"}
        tone={isProjectDarkSurface ? "dark" : "light"}
        action={!isHome && !isProjectDarkSurface ? <CreditBadge credits={remainingCredits} /> : undefined}
        className={isHome ? "mb-4 px-3" : isProjectDarkSurface ? "mb-3 px-3" : "mb-4 px-3"}
      />

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
