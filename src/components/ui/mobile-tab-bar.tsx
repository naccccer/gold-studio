import Link from "next/link";

type Tab = { href: string; label: string; active?: boolean };

export function MobileTabBar({ tabs, ctaHref = "/projects/new" }: { tabs: Tab[]; ctaHref?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.8rem)] pt-2 backdrop-blur-sm md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1 text-center">
        {tabs.slice(0, 2).map((tab) => (
          <Link key={tab.href} href={tab.href} className={`px-2 py-2 text-xs ${tab.active ? "text-foreground" : "text-muted"}`}>
            {tab.label}
          </Link>
        ))}
        <Link href={ctaHref} className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-accent/40 bg-accent-soft text-accent-foreground shadow-[var(--shadow-soft)]">
          +
        </Link>
        {tabs.slice(2, 4).map((tab) => (
          <Link key={tab.href} href={tab.href} className={`px-2 py-2 text-xs ${tab.active ? "text-foreground" : "text-muted"}`}>
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
