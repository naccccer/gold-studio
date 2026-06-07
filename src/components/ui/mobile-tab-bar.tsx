"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Images, Sparkles, User, Plus } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils/cn";

type TabIcon = "home" | "gallery" | "projects" | "account";

type TabItem = {
  href: string;
  label: string;
  icon: TabIcon;
  match?: "exact" | "prefix";
};

type MobileTabBarProps = {
  tabs: TabItem[];
  centerAction: { href: string; label: string };
};

const ICONS: Record<TabIcon, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  home: House,
  gallery: Images,
  projects: Sparkles,
  account: User,
};

function isActive(pathname: string, tab: TabItem) {
  if (tab.match === "exact") return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function MobileTabBar({ tabs, centerAction }: MobileTabBarProps) {
  const pathname = usePathname();
  const centerActive = pathname === centerAction.href || pathname.startsWith(`${centerAction.href}/`);

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-[var(--page-x)] pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
    >
      <div
        dir="ltr"
        className={cn(
          "grid w-full max-w-[420px] grid-cols-5 items-center rounded-[var(--r-2xl)]",
          "border border-border-hairline bg-surface/85 backdrop-blur-xl",
          "shadow-[var(--shadow-lg)] p-1.5",
        )}
      >
        {tabs.slice(0, 2).map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isActive(pathname, tab)} />
        ))}

        <Link
          href={centerAction.href}
          aria-label={centerAction.label}
          aria-current={centerActive ? "page" : undefined}
          className={cn(
            "ov-press mx-auto inline-flex h-12 w-12 items-center justify-center rounded-[var(--r-lg)]",
            "bg-gradient-to-b from-champagne-300 to-champagne-500 text-champagne-ink",
            "shadow-[var(--shadow-gold)]",
          )}
        >
          <Plus aria-hidden className="h-5 w-5" strokeWidth={2.5} />
        </Link>

        {tabs.slice(2).map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isActive(pathname, tab)} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({ tab, active }: { tab: TabItem; active: boolean }) {
  const Icon = ICONS[tab.icon];
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "ov-press flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[var(--r-md)] py-1.5",
        "text-[10px] font-semibold leading-none",
        active
          ? "bg-surface-soft text-ink-1"
          : "text-ink-3 hover:text-ink-1",
      )}
    >
      <Icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
      <span>{tab.label}</span>
    </Link>
  );
}
