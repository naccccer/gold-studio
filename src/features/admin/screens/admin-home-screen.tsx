import { Surface } from "@/components/ui/surface";
import { CreditsForm } from "@/features/admin/components/credits-form";

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  credits: number;
};

type AdminHomeScreenProps = {
  users: AdminUserListItem[];
  projectsCount: number;
  completedCount: number;
};

export function AdminHomeScreen({ users, projectsCount, completedCount }: AdminHomeScreenProps) {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Surface radius="md" className="border-amber-200">
          <p className="text-xs text-slate-500">کل پروژه‌ها</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{projectsCount}</p>
        </Surface>
        <Surface radius="md" className="border-amber-200">
          <p className="text-xs text-slate-500">پروژه تکمیل‌شده</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{completedCount}</p>
        </Surface>
      </div>

      <Surface className="border-amber-200" padding="lg">
        <h2 className="text-lg font-semibold text-slate-900">کنترل دستی اعتبار کاربران</h2>
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-amber-100 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{user.name || user.email}</p>
                <p className="text-xs text-slate-500" dir="ltr">{user.email} - {user.role}</p>
              </div>
              <CreditsForm userId={user.id} credits={user.credits} />
            </div>
          ))}
        </div>
      </Surface>
    </section>
  );
}
