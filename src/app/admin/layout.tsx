import Link from "next/link";
import { ArrowRight, Boxes, CreditCard, Gauge, Images, LifeBuoy, Palette, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/session";

const adminNav = [
  { href: "/admin", label: "نمای کلی", icon: Gauge },
  { href: "/admin/projects", label: "پروژه‌ها", icon: Images },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/packages", label: "پکیج و اعتبار", icon: CreditCard },
  { href: "/admin/support", label: "پشتیبانی", icon: LifeBuoy },
  { href: "/admin/styles", label: "سبک‌ها", icon: Palette },
  { href: "/admin/provider", label: "عملیات AI", icon: Boxes },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-background px-3 py-4 text-right text-foreground md:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-[var(--radius-lg)] border border-border/80 bg-surface p-3 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="flex items-start justify-between gap-3 lg:block">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Ovala Ops</p>
              <h1 className="mt-1 text-xl font-semibold text-foreground">پنل ادمین</h1>
              <p className="mt-1 text-xs leading-6 text-muted">عملیات، پرداخت، دسترسی و کیفیت تولید</p>
            </div>
            <ButtonLink href="/account" variant="secondary" size="sm" className="shrink-0 lg:mt-4 lg:w-full">
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
              حساب
            </ButtonLink>
          </div>

          <nav className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-1" aria-label="ناوبری ادمین">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/45 px-2 text-xs font-medium text-muted transition hover:border-border-strong hover:bg-surface hover:text-foreground lg:justify-start"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 space-y-4 pb-12">{children}</main>
      </div>
    </div>
  );
}
