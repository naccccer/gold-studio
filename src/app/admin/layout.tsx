import Link from "next/link";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-amber-50 px-4 py-4 text-right text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col rounded-[2rem] border border-amber-200 bg-white shadow-[0_24px_80px_-32px_rgba(120,53,15,0.25)]">
        <header className="border-b border-amber-200 px-4 py-4 sm:px-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-amber-700">GOLD STUDIO ADMIN</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-slate-950">پنل مدیریت</h1>
              <p className="text-sm text-slate-600">مدیریت کاربران، پروژه‌ها و اعتبارها به‌صورت دستی.</p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-full border border-amber-200 px-4 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
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
