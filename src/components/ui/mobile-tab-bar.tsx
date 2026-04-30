"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabIcon = "home" | "archive" | "admin" | "account" | "sparkle";

type TabItem = {
  href: string;
  label: string;
  icon: TabIcon;
  match?: "exact" | "prefix" | "never";
  active?: boolean;
};

type MobileTabBarProps = {
  tabs: TabItem[];
  centerAction: { href: string; label: string };
};

function Icon({ name }: { name: TabIcon }) {
  const common = "h-[18px] w-[18px]";

  if (name === "home") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
        <path d="M4.75 10.7 12 4.75l7.25 5.95v7.55a1 1 0 0 1-1 1h-3.5v-5.5h-5.5v5.5h-3.5a1 1 0 0 1-1-1V10.7Z" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "archive") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
        <path d="M5.5 6.25h13M6.75 9.5h10.5v8.75H6.75V9.5Z" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.25 12.25h5.5" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "admin") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
        <path d="M12 4.75 18.25 7v4.55c0 3.25-2.55 6.15-6.25 7.7-3.7-1.55-6.25-4.45-6.25-7.7V7L12 4.75Z" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
        <path d="M9.5 12.1 11.15 14l3.35-4" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "account") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
        <path d="M12 12.25a3.35 3.35 0 1 0 0-6.7 3.35 3.35 0 0 0 0 6.7Z" fill="none" stroke="currentColor" strokeWidth="1.65" />
        <path d="M6.25 19.1c.85-2.7 2.75-4.05 5.75-4.05s4.9 1.35 5.75 4.05" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
      <path d="m12 4.75 1.45 3.8 3.8 1.45-3.8 1.45L12 15.25l-1.45-3.8-3.8-1.45 3.8-1.45L12 4.75Z" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
      <path d="m17.75 14.75.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" fill="currentColor" />
    </svg>
  );
}

function isActivePath(pathname: string, tab: TabItem) {
  if (tab.match === "never") {
    return Boolean(tab.active);
  }

  if (tab.match === "exact" || tab.href === "/dashboard") {
    return pathname === tab.href || Boolean(tab.active);
  }

  return pathname === tab.href || pathname.startsWith(`${tab.href}/`) || Boolean(tab.active);
}

export function MobileTabBar({ tabs, centerAction }: MobileTabBarProps) {
  const pathname = usePathname();
  const splitIndex = Math.ceil(tabs.length / 2);
  const groups = [tabs.slice(0, splitIndex), tabs.slice(splitIndex)];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden" aria-label="ناوبری اصلی">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="grid grid-cols-5 items-center rounded-[1.45rem] border border-white/75 bg-surface/95 px-2 py-2 text-center shadow-[0_20px_55px_-44px_rgba(23,20,17,0.9)]">
          {groups[0].map((tab, index) => {
            const active = isActivePath(pathname, tab);

            return (
              <Link
                key={`${tab.href}-${tab.label}-${index}`}
                href={tab.href}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-[10px] leading-none transition ${
                  active ? "text-foreground" : "text-muted/55"
                }`}
              >
                <Icon name={tab.icon} />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          <Link
            href={centerAction.href}
            aria-label={centerAction.label}
            className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d7bd8f] bg-[#c39a5f] text-surface shadow-[0_16px_30px_-22px_rgba(43,33,23,0.9)]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M12 5.5v13M5.5 12h13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </Link>

          {groups[1].map((tab, index) => {
            const active = isActivePath(pathname, tab);

            return (
              <Link
                key={`${tab.href}-${tab.label}-${index}`}
                href={tab.href}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-[10px] leading-none transition ${
                  active ? "text-foreground" : "text-muted/55"
                }`}
              >
                <Icon name={tab.icon} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
