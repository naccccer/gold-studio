"use client";

import Link from "next/link";
import { Home, Images, Plus, User, Wallpaper } from "lucide-react";
import { usePathname } from "next/navigation";

type TabItem = {
  href: string;
  label: string;
  icon: "home" | "gallery" | "projects" | "account";
  match?: "exact" | "prefix";
};

type MobileTabBarProps = {
  tabs: TabItem[];
  centerAction: { href: string; label: string };
};

const icons = {
  home: Home,
  gallery: Wallpaper,
  projects: Images,
  account: User,
};

function isActivePath(pathname: string, tab: TabItem) {
  if (tab.match === "exact") {
    return pathname === tab.href;
  }

  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function MobileTabBar({ tabs, centerAction }: MobileTabBarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden" aria-label="ناوبری اصلی">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="grid grid-cols-5 items-center rounded-[1.35rem] border border-white/80 bg-surface/95 px-2 py-2 text-center shadow-[0_22px_55px_-44px_rgba(23,20,17,0.85)]">
          {tabs.slice(0, 2).map((tab) => {
            const Icon = icons[tab.icon];
            const active = isActivePath(pathname, tab);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-[10px] leading-none transition ${
                  active ? "text-foreground" : "text-muted/55"
                }`}
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.7} />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          <Link
            href={centerAction.href}
            aria-label={centerAction.label}
            className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d8bd8d] bg-[#c89f61] text-surface shadow-[0_18px_34px_-24px_rgba(43,33,23,0.9)] transition hover:bg-[#bb9256]"
          >
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </Link>

          {tabs.slice(2).map((tab) => {
            const Icon = icons[tab.icon];
            const active = isActivePath(pathname, tab);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-[10px] leading-none transition ${
                  active ? "text-foreground" : "text-muted/55"
                }`}
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.7} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
