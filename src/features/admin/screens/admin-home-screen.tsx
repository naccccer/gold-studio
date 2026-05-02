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
        <Surface radius="md" className="bg-surface-soft/50">
          <p className="text-xs text-muted">کل پروژه‌ها</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{projectsCount}</p>
        </Surface>
        <Surface radius="md" className="bg-surface-soft/50">
          <p className="text-xs text-muted">پروژه تکمیل‌شده</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{completedCount}</p>
        </Surface>
      </div>

      <Surface padding="lg">
        <h2 className="text-base font-semibold text-foreground">اعتبار کاربران</h2>
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border/70 bg-surface-soft/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
                <p className="text-xs text-muted" dir="ltr">{user.email} - {user.role}</p>
              </div>
              <CreditsForm userId={user.id} credits={user.credits} />
            </div>
          ))}
        </div>
      </Surface>
    </section>
  );
}
