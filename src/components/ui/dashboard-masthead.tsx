"use client";

import Link from "next/link";
import { Home, Images, Plus, User, Wallpaper } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppTopBar } from "@/components/ui/app-top-bar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";

type DashboardMastheadProps = {
  userLabel: string;
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

function navClass(active: boolean) {
  return [
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] transition",
    active ? "bg-foreground text-surface shadow-[var(--shadow-soft)]" : "text-muted hover:bg-surface-soft hover:text-foreground",
  ].join(" ");
}

export function DashboardMasthead({ userLabel }: DashboardMastheadProps) {
  const pathname = usePathname();
  const context = pageContext(pathname);
  const isHome = pathname === "/dashboard";
  const isProjectDetail = /^\/projects\/[^/]+$/.test(pathname);

  return (
    <>
      <div className="md:hidden">
        <AppTopBar
          title={isHome ? undefined : context.title}
          backHref={context.parent}
          centeredLogo={isHome}
          logoVariant={isHome ? "primary" : "mark"}
          tone={isProjectDetail ? "dark" : "light"}
          className={isHome ? "mb-4" : isProjectDetail ? "mb-3" : "mb-4"}
        />
      </div>

      <header className="mb-5 hidden items-center justify-between gap-4 rounded-[1.15rem] border border-border/70 bg-surface/80 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur md:flex">
        <Link href="/dashboard" className="shrink-0" aria-label="OVALA Studio">
          <BrandLogo variant="wordmark" />
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
          <Link
            href="/projects/new"
            className={[
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-surface transition",
              pathname === "/projects/new" ? "bg-foreground" : "bg-accent hover:bg-[#a87f47]",
            ].join(" ")}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            پروژه جدید
          </Link>
          <Link href="/projects" className={navClass(pathname.startsWith("/projects") && pathname !== "/projects/new")}>
            <Images aria-hidden="true" className="h-4 w-4" />
            پروژه‌ها
          </Link>
          <Link href="/account" className={navClass(pathname === "/account")}>
            <User aria-hidden="true" className="h-4 w-4" />
            حساب
          </Link>
        </nav>

        <p className="max-w-[12rem] truncate text-[11px] leading-5 text-muted/70">{userLabel}</p>
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
