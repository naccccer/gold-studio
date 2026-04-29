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
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-surface/95 px-3 pb-3 pt-2 backdrop-blur-sm md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1 text-center">
        {tabs.slice(0, 2).map((tab) => (
          <Link key={tab.href} href={tab.href} className={`space-y-1 rounded-[var(--radius-sm)] px-1 py-2 text-xs ${tab.active ? "text-foreground" : "text-muted"}`}>
            <span className="block h-1.5 w-1.5 mx-auto rounded-full bg-current/50" />
            <span>{tab.label}</span>
          </Link>
        ))}
        <Link href={centerAction.href} className="-translate-y-3 inline-flex h-12 w-12 items-center justify-center justify-self-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-soft)]">
          +
        </Link>
        {tabs.slice(2).map((tab) => (
          <Link key={tab.href} href={tab.href} className={`space-y-1 rounded-[var(--radius-sm)] px-1 py-2 text-xs ${tab.active ? "text-foreground" : "text-muted"}`}>
            <span className="block h-1.5 w-1.5 mx-auto rounded-full bg-current/50" />
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
