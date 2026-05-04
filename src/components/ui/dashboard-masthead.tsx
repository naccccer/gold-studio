"use client";

import Link from "next/link";
import { ChevronRight, Home, Images, Plus, User, Wallpaper } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";

type DashboardMastheadProps = {
  userLabel: string;
};

const titles: Array<{ match: (pathname: string) => boolean; title: string; parent?: string }> = [
  { match: (pathname) => pathname === "/projects/new", title: "پروژه جدید", parent: "/dashboard" },
  { match: (pathname) => pathname.startsWith("/gallery/batches/"), title: "دسته تولید", parent: "/gallery" },
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

function navClass(active: boolean) {
  return [
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] transition",
    active ? "bg-foreground text-surface shadow-[var(--shadow-soft)]" : "text-muted hover:bg-surface-soft hover:text-foreground",
  ].join(" ");
}

export function DashboardMasthead({ userLabel }: DashboardMastheadProps) {
  const pathname = usePathname();
  const context = pageContext(pathname);
  const isProjectDetail = /^\/projects\/[^/]+$/.test(pathname);

  return (
    <>
      <header className={isProjectDetail ? "mb-3 text-surface" : "mb-4"}>
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-full border border-border/70 bg-surface/92 px-2.5 py-1.5 shadow-[0_18px_42px_-38px_rgba(23,20,17,0.55)] backdrop-blur md:hidden">
          {context.parent ? (
            <Link
              href={context.parent}
              aria-label="بازگشت"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-foreground"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          ) : (
            <span className="h-8 w-8" aria-hidden="true" />
          )}

          <h1 className="truncate text-sm font-semibold text-foreground">{context.title}</h1>

          <Link href="/dashboard" className="shrink-0 text-left leading-none" dir="ltr" aria-label="OVALA">
            <span className="block font-display text-[11px] tracking-[0.16em] text-accent-foreground">OVALA</span>
            <span className="mt-0.5 block text-[6px] tracking-[0.34em] text-accent">STUDIO</span>
          </Link>
        </div>

        <div className="hidden items-center justify-between gap-4 rounded-[1.25rem] border border-border/70 bg-surface/85 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur md:flex">
          <Link href="/dashboard" className="shrink-0 text-left leading-none" dir="ltr" aria-label="OVALA">
            <span className="block font-display text-[16px] tracking-[0.14em] text-accent-foreground">OVALA</span>
            <span className="mt-1 block text-[8px] tracking-[0.34em] text-accent">STUDIO</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="ناوبری اصلی">
            <Link href="/dashboard" className={navClass(pathname === "/dashboard")}>
              <Home aria-hidden="true" className="h-4 w-4" />
              خانه
            </Link>
            <Link href="/gallery" className={navClass(pathname.startsWith("/gallery"))}>
              <Wallpaper aria-hidden="true" className="h-4 w-4" />
              گالری
            </Link>
            <Link href="/projects" className={navClass(pathname.startsWith("/projects") && pathname !== "/projects/new")}>
              <Images aria-hidden="true" className="h-4 w-4" />
              پروژه‌ها
            </Link>
            <Link href="/projects/new" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-[13px] font-medium text-surface transition hover:bg-[#a87f47]">
              <Plus aria-hidden="true" className="h-4 w-4" />
              جدید
            </Link>
            <Link href="/account" className={navClass(pathname === "/account")}>
              <User aria-hidden="true" className="h-4 w-4" />
              حساب
            </Link>
          </nav>

          <p className="max-w-[12rem] truncate text-[11px] leading-5 text-muted/70">{userLabel}</p>
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
