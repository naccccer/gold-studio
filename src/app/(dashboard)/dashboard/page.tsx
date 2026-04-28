import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireUserSession();

  const [user, projectCount, completedCount] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId } }),
    db.project.count({ where: { userId: session.userId } }),
    db.project.count({ where: { userId: session.userId, status: "COMPLETED" } }),
  ]);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">سلام {user?.name || "دوست عزیز"} 👋</h2>
        <p className="mt-2 text-sm text-slate-600">از اینجا می‌توانید پروژه جدید بسازید و خروجی‌ها را دانلود کنید.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">اعتبار باقی‌مانده</p>
          <p className="mt-2 text-xl font-semibold">نامحدود</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">کل پروژه‌ها</p>
          <p className="mt-2 text-xl font-semibold">{projectCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500">خروجی آماده</p>
          <p className="mt-2 text-xl font-semibold">{completedCount}</p>
        </div>
      </div>

      <Link
        href="/projects/new"
        className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        پروژه جدید
      </Link>
    </section>
  );
}
