import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
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
    <div className="min-h-screen bg-slate-100 px-4 py-4 text-right text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)]">
        <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-amber-700">GOLD STUDIO APP</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-slate-950">داشبورد کاربر</h1>
              <p className="text-sm text-slate-600">
                {user?.name || user?.email} • اعتبار: {user?.credits ?? 0}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/dashboard" className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200">
                داشبورد
              </Link>
              <Link href="/projects" className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200">
                پروژه‌ها
              </Link>
              <Link href="/projects/new" className="rounded-full bg-slate-950 px-4 py-2 text-white transition-colors hover:bg-slate-800">
                پروژه جدید
              </Link>
              {session.role === "ADMIN" ? (
                <Link href="/admin" className="rounded-full border border-amber-200 px-4 py-2 text-amber-900 transition-colors hover:bg-amber-50">
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
