import Link from "next/link";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireUserSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true, credits: true },
  });

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6 text-right text-foreground">
      <div className="mx-auto w-full max-w-5xl space-y-7">
        <header className="space-y-5 border-b border-border/70 pb-5">
          <div className="space-y-1.5">
            <p className="text-display text-2xl text-foreground">استودیو طلایی شما</p>
            <p className="text-sm text-muted">{user?.name || user?.email} • اعتبار: نامحدود</p>
          </div>

          <nav className="hidden flex-wrap items-center gap-2 text-sm md:flex">
            <Link href="/projects/new" className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-foreground px-4 text-surface">پروژه جدید</Link>
            <Link href="/dashboard" className="inline-flex h-10 items-center rounded-[var(--radius-md)] px-3 text-muted hover:text-foreground">داشبورد</Link>
            <Link href="/projects" className="inline-flex h-10 items-center rounded-[var(--radius-md)] px-3 text-muted hover:text-foreground">پروژه‌ها</Link>
            {session.role === "ADMIN" ? <Link href="/admin" className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-accent-soft px-3 text-accent-foreground">مدیریت</Link> : null}
            <LogoutButton />
          </nav>
        </header>

        <div className="space-y-6">{children}</div>
      </div>

      <MobileTabBar
        tabs={[
          { href: "/dashboard", label: "خانه", active: true },
          { href: "/projects", label: "پروژه‌ها" },
          { href: "/admin", label: "مدیریت", active: false },
          { href: "/dashboard", label: "پروفایل" },
        ]}
        centerAction={{ href: "/projects/new", label: "پروژه جدید" }}
      />
    </div>
  );
}
