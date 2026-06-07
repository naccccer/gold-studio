"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Coins } from "lucide-react";
import { AppTopBar } from "@/components/ui/app-top-bar";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";
import { cn } from "@/lib/utils/cn";

type DashboardMastheadProps = {
  userLabel: string;
  remainingCredits: number;
};

const ROUTE_TITLES: Array<{ match: (pathname: string) => boolean; title: string; parent?: string }> = [
  { match: (p) => p === "/projects/new", title: "پروژه جدید", parent: "/gallery" },
  { match: (p) => p.startsWith("/gallery/batches/"), title: "دسته تولید", parent: "/gallery" },
  { match: (p) => p === "/gallery/crop", title: "کراپ تصویر", parent: "/gallery" },
  { match: (p) => /^\/gallery\/[^/]+$/.test(p), title: "تصویر", parent: "/gallery" },
  { match: (p) => p.startsWith("/gallery"), title: "گالری" },
  { match: (p) => /^\/projects\/[^/]+$/.test(p), title: "نتیجه", parent: "/projects" },
  { match: (p) => p === "/projects", title: "پروژه‌ها" },
  { match: (p) => p === "/account/profile", title: "پروفایل", parent: "/account" },
  { match: (p) => p === "/account/referral", title: "کد معرفی", parent: "/account" },
  { match: (p) => p === "/account/security", title: "امنیت", parent: "/account" },
  { match: (p) => p === "/account/support", title: "پشتیبانی", parent: "/account" },
  { match: (p) => p === "/account/faq", title: "سوالات پرتکرار", parent: "/account" },
  { match: (p) => p === "/account/output-settings", title: "تنظیمات خروجی", parent: "/account" },
  { match: (p) => p === "/account/archive", title: "آرشیو", parent: "/account" },
  { match: (p) => p === "/account/style-references", title: "نمونه‌ها", parent: "/account" },
  { match: (p) => p === "/account", title: "حساب" },
  { match: (p) => p === "/billing", title: "پلن‌ها", parent: "/account" },
  { match: () => true, title: "خانه" },
];

function resolvePageContext(pathname: string) {
  return ROUTE_TITLES.find((entry) => entry.match(pathname)) ?? ROUTE_TITLES[ROUTE_TITLES.length - 1];
}

function CreditBadge({ credits }: { credits: number }) {
  return (
    <Link
      href="/billing"
      aria-label={`اعتبار باقی‌مانده: ${credits.toLocaleString("fa-IR")}`}
      className={cn(
        "ov-press inline-flex h-9 items-center gap-1.5 rounded-[var(--r-pill)]",
        "bg-surface border border-border px-3 text-[12px] font-bold text-ink-1",
        "shadow-[var(--shadow-xs)]",
      )}
    >
      <span className="text-mono">{credits.toLocaleString("fa-IR")}</span>
      <Coins aria-hidden className="h-3.5 w-3.5 text-champagne-500" strokeWidth={2.2} />
    </Link>
  );
}

export function DashboardMasthead({ userLabel, remainingCredits }: DashboardMastheadProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const context = resolvePageContext(pathname);
  const isHome = pathname === "/dashboard";
  const isStudioWizard = pathname === "/projects/new";
  const isProjectDetail = /^\/projects\/[^/]+$/.test(pathname);
  const showBottomNav = !isStudioWizard && !pathname.startsWith("/gallery/batches/") && !isProjectDetail;
  const fromBatch = searchParams.get("fromBatch");
  const backHref =
    fromBatch && isProjectDetail ? `/gallery/batches/${fromBatch}` : context.parent;

  return (
    <>
      {!isStudioWizard ? (
        <AppTopBar
          title={isHome ? undefined : context.title}
          backHref={backHref}
          centeredLogo={isHome}
          logoVariant={isHome ? "primary" : "wordmark"}
          action={!isHome ? <CreditBadge credits={remainingCredits} /> : undefined}
          className="px-[var(--page-x)]"
        />
      ) : null}

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
