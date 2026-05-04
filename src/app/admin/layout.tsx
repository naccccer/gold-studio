import Link from "next/link";
import { ArrowRight, CreditCard, Images, Palette, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/session";

const adminNav = [
  { href: "/admin", label: "کاربران", icon: Users },
  { href: "/admin/projects", label: "پروژه‌ها", icon: Images },
  { href: "/admin/access", label: "دسترسی", icon: CreditCard },
  { href: "/admin/styles", label: "سبک‌ها", icon: Palette },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-5 text-right text-foreground">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header className="space-y-4 border-b border-border/70 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium text-muted">OVALA Admin</p>
              <h1 className="text-display text-[2rem] leading-tight text-foreground">مدیریت</h1>
              <p className="mt-1 text-sm leading-7 text-muted">فضای عملیاتی برای پشتیبانی، دسترسی و سبک‌ها.</p>
            </div>
            <ButtonLink href="/dashboard" variant="secondary" size="sm" className="shrink-0">
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
              استودیو
            </ButtonLink>
          </div>

          <nav className="grid grid-cols-4 gap-2" aria-label="ناوبری مدیریت">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-border/70 bg-surface px-2 text-[10px] text-muted transition hover:border-border-strong hover:text-foreground"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
