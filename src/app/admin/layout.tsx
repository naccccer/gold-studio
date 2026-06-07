import Link from "next/link";
import { ChevronRight, Box, CreditCard, LayoutGrid, Images, Gift, House, Image, LifeBuoy, User, ChevronLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/session";

const adminNav = [
  { href: "/admin", label: "نمای کلی", icon: House },
  { href: "/admin/projects", label: "پروژه‌ها", icon: Images },
  { href: "/admin/assets", label: "دارایی‌ها", icon: Image },
  { href: "/admin/users", label: "کاربران", icon: User },
  { href: "/admin/packages", label: "پکیج و اعتبار", icon: CreditCard },
  { href: "/admin/support", label: "پشتیبانی", icon: LifeBuoy },
  { href: "/admin/styles", label: "سبک‌ها", icon: LayoutGrid },
  { href: "/admin/provider", label: "عملیات AI", icon: Box },
];

adminNav.splice(4, 0, { href: "/admin/referrals", label: "کدهای معرف", icon: Gift });

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-background px-3 py-4 text-right text-foreground md:px-5">
      <div className="mx-auto grid w-full max-w-[1440px] gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-[var(--radius-lg)] border border-border/80 bg-surface p-3 shadow-[var(--shadow-soft)] xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:self-start">
          <div className="flex items-start justify-between gap-3 lg:block">
            <div>
              <p className="text-[11px] font-semibold text-accent-deep">Ovala Ops</p>
              <h1 className="mt-1 text-lg font-semibold leading-7 text-foreground">پنل ادمین</h1>
              <p className="mt-1 max-w-48 text-xs leading-6 text-muted">عملیات، پرداخت، دسترسی و کیفیت تولید</p>
            </div>
            <ButtonLink href="/account" variant="secondary" size="sm" className="shrink-0 lg:mt-4 lg:w-full">
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
              حساب
            </ButtonLink>
          </div>

          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-1" aria-label="ناوبری ادمین">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/45 px-2.5 text-xs font-medium text-muted transition hover:border-border-strong hover:bg-surface hover:text-foreground xl:justify-start"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 space-y-3 pb-12">{children}</main>
      </div>
    </div>
  );
}
