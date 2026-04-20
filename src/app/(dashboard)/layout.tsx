import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-4 text-right text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)]">
        <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-amber-700">
            GOLD STUDIO APP
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-slate-950">
                پوسته موقت داشبورد
              </h1>
              <p className="text-sm text-slate-600">
                این لایه برای مسیرهای اصلی کاربر در MVP استفاده می‌شود.
              </p>
            </div>

            <nav className="flex flex-wrap gap-2 text-sm">
              <Link
                href="/dashboard"
                className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200"
              >
                داشبورد
              </Link>
              <Link
                href="/projects"
                className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200"
              >
                پروژه‌ها
              </Link>
              <Link
                href="/projects/new"
                className="rounded-full bg-slate-950 px-4 py-2 text-white transition-colors hover:bg-slate-800"
              >
                پروژه جدید
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
