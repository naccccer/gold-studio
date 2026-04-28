import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background px-4 py-5 text-right text-foreground sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border/80 bg-surface/95">
        <header className="border-b border-border/80 px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Gold Studio Admin</p>
              <h1 className="text-lg font-medium text-foreground">اتاق مدیریت</h1>
              <p className="text-sm text-muted">مدیریت کاربران، پروژه‌ها و اعتبارها به‌صورت دستی.</p>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-accent-soft px-4 text-sm text-accent-foreground transition-colors hover:border-accent hover:bg-accent-soft"
              >
                داشبورد کاربر
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </header>

        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-7">{children}</div>
      </div>
    </div>
  );
}
