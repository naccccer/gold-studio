"use client";

import Link from "next/link";
import { Home, Images, Plus, User, Wallpaper } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";

type DashboardMastheadProps = {
  userLabel: string;
};

const titles: Array<{ match: (pathname: string) => boolean; title: string }> = [
  { match: (pathname) => pathname === "/projects/new", title: "پروژه جدید" },
  { match: (pathname) => pathname.startsWith("/gallery"), title: "گالری" },
  { match: (pathname) => pathname.startsWith("/projects/"), title: "بررسی نتیجه" },
  { match: (pathname) => pathname === "/projects", title: "پروژه‌ها" },
  { match: (pathname) => pathname === "/account", title: "حساب" },
  { match: () => true, title: "خانه" },
];

function pageTitle(pathname: string) {
  return titles.find((item) => item.match(pathname))?.title ?? "خانه";
}

function navClass(active: boolean) {
  return [
    "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-[13px] transition",
    active ? "bg-surface text-foreground shadow-[var(--shadow-soft)]" : "text-muted hover:bg-surface-soft hover:text-foreground",
  ].join(" ");
}

export function DashboardMasthead({ userLabel }: DashboardMastheadProps) {
  const pathname = usePathname();
  const title = pageTitle(pathname);
  const isProjectDetail = /^\/projects\/[^/]+$/.test(pathname);

  return (
    <>
      <header className={isProjectDetail ? "mb-3 flex items-center justify-between px-1" : "mb-5 flex items-start justify-between gap-4"}>
        <div className={isProjectDetail ? "space-y-0.5 text-surface" : "space-y-0.5"}>
          <p className="text-[11px] font-medium text-muted">Gold Studio</p>
          <h1 className="text-display text-[2rem] leading-tight">{title}</h1>
        </div>

        <Link href="/dashboard" className="shrink-0 text-left leading-none" dir="ltr" aria-label="Gold Studio">
          <span className="block font-display text-[16px] tracking-[0.14em] text-accent-foreground">GOLD</span>
          <span className="mt-1 block text-[8px] tracking-[0.34em] text-accent">STUDIO</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <p className="max-w-[12rem] truncate text-[11px] leading-5 text-muted/70">{userLabel}</p>
          <nav className="flex items-center gap-1" aria-label="ناوبری اصلی">
            <Link href="/dashboard" className={navClass(pathname === "/dashboard")}>
              <Home aria-hidden="true" className="h-4 w-4" />
              خانه
            </Link>
            <Link href="/gallery" className={navClass(pathname.startsWith("/gallery"))}>
              <Wallpaper aria-hidden="true" className="h-4 w-4" />
              گالری
            </Link>
            <Link href="/projects" className={navClass(pathname.startsWith("/projects"))}>
              <Images aria-hidden="true" className="h-4 w-4" />
              پروژه‌ها
            </Link>
            <Link href="/projects/new" className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-foreground px-3 text-[13px] text-surface transition hover:bg-[#27231f]">
              <Plus aria-hidden="true" className="h-4 w-4" />
              پروژه جدید
            </Link>
            <Link href="/account" className={navClass(pathname === "/account")}>
              <User aria-hidden="true" className="h-4 w-4" />
              حساب
            </Link>
          </nav>
        </div>
      </header>

      <MobileTabBar
        tabs={[
          { href: "/dashboard", label: "خانه", icon: "home", match: "exact" },
          { href: "/gallery", label: "گالری", icon: "gallery" },
          { href: "/projects", label: "پروژه‌ها", icon: "projects" },
          { href: "/account", label: "حساب", icon: "account", match: "exact" },
        ]}
        centerAction={{ href: "/projects/new", label: "پروژه جدید" }}
      />
    </>
  );
}
