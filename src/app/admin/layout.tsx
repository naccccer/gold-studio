import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-6 text-right text-foreground">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-3 border-b border-border/70 pb-5">
          <p className="text-display text-xl">مدیریت داخلی</p>
          <p className="text-sm text-muted">برای بررسی کاربران و اعتبارها.</p>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard" className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-border px-3 text-sm text-muted hover:text-foreground">
              داشبورد کاربر
            </Link>
            <LogoutButton />
          </nav>
        </header>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
