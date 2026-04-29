import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background px-4 pb-10 pt-6 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <p className="text-meta">Gold Studio Admin</p>
            <h1 className="font-display text-3xl">اتاق مدیریت</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="inline-flex h-10 items-center rounded-[var(--radius-md)] px-4 text-sm text-muted hover:bg-surface-soft">داشبورد کاربر</Link>
            <LogoutButton />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
