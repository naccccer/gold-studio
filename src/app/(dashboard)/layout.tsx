import Link from "next/link";
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
    <div className="min-h-screen bg-background px-4 py-5 text-right text-foreground sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border/80 bg-surface/95">
        <header className="border-b border-border/80 px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Gold Studio</p>
              <h1 className="text-lg font-medium text-foreground">فضای کاری شما</h1>
              <p className="text-sm text-muted">
                {user?.name || user?.email} • اعتبار: {"نامحدود"}
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link href="/projects/new" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-foreground px-4 text-sm font-medium text-surface transition-colors hover:bg-accent-foreground">
                پروژه جدید
              </Link>
              <Link href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface-soft px-4 text-sm text-muted transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-foreground">
                داشبورد
              </Link>
              <Link href="/projects" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface-soft px-4 text-sm text-muted transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-foreground">
                پروژه‌ها
              </Link>
              {session.role === "ADMIN" ? (
                <Link href="/admin" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-accent-soft px-4 text-sm text-accent-foreground transition-colors hover:border-accent hover:bg-accent-soft">
                  مدیریت
                </Link>
              ) : null}
              <LogoutButton />
            </nav>
          </div>
        </header>

        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-7">{children}</div>
      </div>
    </div>
  );
}
