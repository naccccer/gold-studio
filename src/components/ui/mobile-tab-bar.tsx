"use client";

import Link from "next/link";
import { Add, Gallery, Home2, ProfileCircle, GalleryFavorite } from "vuesax-icons-react";
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
  home: Home2,
  gallery: Gallery,
  projects: GalleryFavorite,
  account: ProfileCircle,
};

function isActivePath(pathname: string, tab: TabItem) {
  if (tab.match === "exact") {
    return pathname === tab.href;
  }

  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function MobileTabBar({ tabs, centerAction }: MobileTabBarProps) {
  const pathname = usePathname();
  const centerActive = pathname === centerAction.href || pathname.startsWith(`${centerAction.href}/`);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40" aria-label="ناوبری اصلی">
      <div className="mx-auto max-w-[393px] px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:max-w-[425px]">
        <div className="grid grid-cols-5 items-center rounded-[1.45rem] border border-white/80 bg-surface/96 px-1.5 py-1.5 text-center shadow-[0_22px_55px_-42px_rgba(23,20,17,0.9)] backdrop-blur">
          {tabs.slice(0, 2).map((tab) => {
            const Icon = icons[tab.icon];
            const active = isActivePath(pathname, tab);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                data-start-guide-target={tab.href === "/gallery" ? "gallery" : undefined}
                aria-current={active ? "page" : undefined}
                className={`motion-nav-item flex min-h-12 flex-col items-center justify-center gap-1 rounded-[1rem] text-[10px] leading-none ${
                  active ? "bg-surface-soft text-foreground" : "text-muted/58 hover:text-foreground"
                }`}
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          <div data-start-guide-target="new-project" className="mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <Link
              href={centerAction.href}
              aria-label={centerAction.label}
              aria-current={centerActive ? "page" : undefined}
              className={[
                "motion-nav-item inline-flex h-12 w-12 items-center justify-center rounded-full text-surface shadow-[0_18px_34px_-22px_rgba(43,33,23,0.9)]",
                centerActive ? "bg-foreground" : "bg-[var(--accent-base)] hover:bg-accent-hover",
              ].join(" ")}
            >
              <Add aria-hidden="true" className="h-5 w-5" />
            </Link>
          </div>

          {tabs.slice(2).map((tab) => {
            const Icon = icons[tab.icon];
            const active = isActivePath(pathname, tab);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                data-start-guide-target={tab.href === "/projects" ? "projects" : undefined}
                aria-current={active ? "page" : undefined}
                className={`motion-nav-item flex min-h-12 flex-col items-center justify-center gap-1 rounded-[1rem] text-[10px] leading-none ${
                  active ? "bg-surface-soft text-foreground" : "text-muted/58 hover:text-foreground"
                }`}
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
