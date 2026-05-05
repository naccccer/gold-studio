import { CreditCard, FolderKanban } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { CreditsForm } from "@/features/admin/components/credits-form";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";

export type AdminUserListItem = {
  id: string;
  email: string | null;
  phone: string | null;
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
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Surface radius="md" className="bg-surface">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted">
            <FolderKanban aria-hidden="true" className="h-3.5 w-3.5" />
            کل پروژه‌ها
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{projectsCount.toLocaleString("fa-IR")}</p>
        </Surface>
        <Surface radius="md" className="bg-surface">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted">
            <CreditCard aria-hidden="true" className="h-3.5 w-3.5" />
            خروجی آماده
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{completedCount.toLocaleString("fa-IR")}</p>
        </Surface>
      </div>

      <Surface padding="lg">
        <h2 className="text-base font-semibold text-foreground">کاربران</h2>
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/35 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{getUserDisplayName(user)}</p>
                <p className="truncate text-xs text-muted" dir="ltr">
                  {getUserIdentifier(user)} · {user.role}
                </p>
              </div>
              <CreditsForm userId={user.id} credits={user.credits} />
            </div>
          ))}
        </div>
      </Surface>
    </section>
  );
}
