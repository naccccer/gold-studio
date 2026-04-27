import { CreditsForm } from "@/components/admin/credits-form";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";

type AdminUserListItem = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  credits: number;
};

export default async function AdminPage() {
  await requireAdminSession();

  const [users, projectsCount, completedCount] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
      },
    }),
    db.project.count(),
    db.project.count({ where: { status: "COMPLETED" } }),
  ]) as [AdminUserListItem[], number, number];

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-amber-200 bg-white p-4">
          <p className="text-xs text-slate-500">کل پروژه‌ها</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{projectsCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white p-4">
          <p className="text-xs text-slate-500">پروژه تکمیل‌شده</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{completedCount}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-white p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-slate-900">کنترل دستی اعتبار کاربران</h2>
        <div className="mt-4 space-y-3">
          {users.map((user: AdminUserListItem) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-amber-100 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{user.name || user.email}</p>
                <p className="text-xs text-slate-500" dir="ltr">{user.email} — {user.role}</p>
              </div>
              <CreditsForm userId={user.id} credits={user.credits} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
