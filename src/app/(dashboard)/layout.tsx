import Link from "next/link";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireUserSession();
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } });

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6 text-foreground">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-meta">{user?.name || user?.email} • اعتبار: نامحدود</p>
            <h1 className="font-display text-3xl">استودیوی شما</h1>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/projects/new" className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-foreground px-4 text-sm text-surface">پروژه جدید</Link>
            <Link href="/dashboard" className="inline-flex h-10 items-center rounded-[var(--radius-md)] px-4 text-sm text-muted hover:bg-surface-soft">داشبورد</Link>
            <Link href="/projects" className="inline-flex h-10 items-center rounded-[var(--radius-md)] px-4 text-sm text-muted hover:bg-surface-soft">پروژه‌ها</Link>
            {session.role === "ADMIN" ? <Link href="/admin" className="inline-flex h-10 items-center rounded-[var(--radius-md)] px-4 text-sm text-accent-foreground">مدیریت</Link> : null}
            <LogoutButton />
          </div>
        </header>
        <main>{children}</main>
      </div>
      <MobileTabBar
        tabs={[
          { href: "/dashboard", label: "خانه" },
          { href: "/projects", label: "پروژه‌ها" },
          { href: "/admin", label: "مدیریت" },
          { href: "/dashboard", label: "حساب" },
        ]}
      />
    </div>
  );
}
