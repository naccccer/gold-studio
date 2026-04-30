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
    <div className="min-h-screen bg-background px-4 pb-24 pt-5 text-right text-foreground">
      <div className="mx-auto w-full max-w-5xl space-y-7">
        <header className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-border/70 bg-surface/70 px-4 py-3 sm:px-5">
          <Link href="/dashboard" className="space-y-0.5">
            <p className="font-display text-2xl leading-tight text-foreground">Gold Studio</p>
            <p className="text-[11px] text-muted">{user?.name || user?.email}</p>
          </Link>

          <div className="hidden items-center gap-1.5 text-sm md:flex">
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-foreground px-3.5 text-surface"
            >
              پروژه جدید
            </Link>
            <Link href="/dashboard" className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-3 text-muted hover:text-foreground">
              خانه
            </Link>
            <Link href="/projects" className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-3 text-muted hover:text-foreground">
              آرشیو
            </Link>
            {session.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-border px-3 text-muted hover:text-foreground"
              >
                مدیریت
              </Link>
            ) : null}
            <LogoutButton />
          </div>
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
