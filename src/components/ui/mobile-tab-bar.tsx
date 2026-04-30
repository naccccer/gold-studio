import Link from "next/link";

type TabItem = {
  href: string;
  label: string;
  active?: boolean;
};

type MobileTabBarProps = {
  tabs: [TabItem, TabItem, TabItem, TabItem];
  centerAction: { href: string; label: string };
};

export function MobileTabBar({ tabs, centerAction }: MobileTabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden">
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="grid grid-cols-5 items-center rounded-[calc(var(--radius-lg)+2px)] border border-border/70 bg-surface/92 px-2 py-2 text-center shadow-[var(--shadow-soft)] backdrop-blur-sm">
          {tabs.slice(0, 2).map((tab) => (
            <Link key={tab.href} href={tab.href} className={`space-y-0.5 rounded-[var(--radius-sm)] px-1 py-1.5 text-[11px] ${tab.active ? "text-foreground" : "text-muted/75"}`}>
              <span className={`mx-auto block h-1 w-1 rounded-full ${tab.active ? "bg-foreground/65" : "bg-muted/35"}`} />
              <span>{tab.label}</span>
            </Link>
          ))}
          <Link
            href={centerAction.href}
            aria-label={centerAction.label}
            className="-translate-y-2 inline-flex h-11 w-11 items-center justify-center justify-self-center rounded-full border border-accent-soft bg-surface text-accent-foreground"
          >
            <span className="text-lg leading-none">+</span>
          </Link>
          {tabs.slice(2).map((tab) => (
            <Link key={tab.href} href={tab.href} className={`space-y-0.5 rounded-[var(--radius-sm)] px-1 py-1.5 text-[11px] ${tab.active ? "text-foreground" : "text-muted/75"}`}>
              <span className={`mx-auto block h-1 w-1 rounded-full ${tab.active ? "bg-foreground/65" : "bg-muted/35"}`} />
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
