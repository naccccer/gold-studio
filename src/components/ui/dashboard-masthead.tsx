"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";
import { LogoutButton } from "@/features/auth/components/logout-button";

type DashboardMastheadProps = {
  userLabel: string;
  isAdmin: boolean;
};

function getPageTitle(pathname: string) {
  if (pathname === "/projects/new") return "پروژه جدید";
  if (pathname.startsWith("/projects")) return "پروژه‌ها";
  if (pathname.startsWith("/admin")) return "مدیریت";
  return "استودیوی من";
}

export function DashboardMasthead({ userLabel, isAdmin }: DashboardMastheadProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <>
      <header className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-display max-w-[13rem] text-[2rem] text-foreground">{pageTitle}</h1>

        <Link href="/dashboard" className="shrink-0 text-left leading-none" dir="ltr" aria-label="Gold Studio">
          <span className="block font-display text-[17px] tracking-[0.14em] text-accent-foreground">GOLD</span>
          <span className="mt-1 block text-[8px] tracking-[0.4em] text-accent">STUDIO</span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <p className="max-w-[12rem] truncate text-[11px] leading-5 text-muted/70">{userLabel}</p>
          <nav className="flex items-center gap-1 text-[13px]">
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-accent-soft bg-surface px-3 text-accent-foreground"
            >
              پروژه جدید
            </Link>
            <Link href="/dashboard" className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-3 text-muted hover:text-foreground">
              خانه
            </Link>
            <Link href="/projects" className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-3 text-muted hover:text-foreground">
              پروژه‌ها
            </Link>
            {isAdmin ? (
              <Link href="/admin" className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-3 text-muted hover:text-foreground">
                مدیریت
              </Link>
            ) : null}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <MobileTabBar
        tabs={[
          { href: "/dashboard", label: "خانه", icon: "home", match: "exact" },
          { href: "/projects", label: "پروژه‌ها", icon: "archive" },
          isAdmin
            ? { href: "/admin", label: "مدیریت", icon: "admin" }
            : { href: "/dashboard", label: "حساب", icon: "account", match: "never" },
          { href: "/dashboard", label: "استودیو", icon: "sparkle", match: "never" },
        ]}
        centerAction={{ href: "/projects/new", label: "پروژه جدید" }}
      />
    </>
  );
}
