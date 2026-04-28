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
    <div className="min-h-screen bg-background px-4 py-4 text-right text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <header className="border-b border-border px-4 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase text-accent">Gold Studio</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-foreground">داشبورد کاربر</h1>
              <p className="text-sm text-muted">
                {user?.name || user?.email} • اعتبار: {"نامحدود"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/dashboard" className="rounded-[var(--radius-md)] bg-surface-soft px-4 py-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground">
                داشبورد
              </Link>
              <Link href="/projects" className="rounded-[var(--radius-md)] bg-surface-soft px-4 py-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground">
                پروژه‌ها
              </Link>
              <Link href="/projects/new" className="rounded-[var(--radius-md)] bg-foreground px-4 py-2 text-surface transition-colors hover:bg-accent-foreground">
                پروژه جدید
              </Link>
              {session.role === "ADMIN" ? (
                <Link href="/admin" className="rounded-[var(--radius-md)] border border-accent-soft px-4 py-2 text-accent-foreground transition-colors hover:border-accent hover:bg-accent-soft">
                  مدیریت
                </Link>
              ) : null}
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
