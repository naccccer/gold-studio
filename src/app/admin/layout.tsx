import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background px-4 py-4 text-right text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col rounded-[var(--radius-xl)] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <header className="border-b border-border px-4 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase text-accent">Gold Studio Admin</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-foreground">پنل مدیریت</h1>
              <p className="text-sm text-muted">مدیریت کاربران، پروژه‌ها و اعتبارها به‌صورت دستی.</p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-accent-soft px-4 text-sm font-medium text-accent-foreground transition-colors hover:border-accent hover:bg-accent-soft"
              >
                داشبورد کاربر
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
