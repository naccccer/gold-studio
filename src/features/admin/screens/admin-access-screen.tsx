import { CreditCard } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { CreditsForm } from "@/features/admin/components/credits-form";
import type { AdminUserListItem } from "@/features/admin/screens/admin-home-screen";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";

type AdminAccessScreenProps = {
  users: AdminUserListItem[];
};

export function AdminAccessScreen({ users }: AdminAccessScreenProps) {
  return (
    <Surface padding="lg">
      <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
        <CreditCard aria-hidden="true" className="h-4 w-4" />
        دسترسی و اعتبار
      </h2>
      <p className="mt-2 text-sm leading-7 text-muted">
        اتصال اشتراک و پرداخت ایرانی در فاز بعدی انجام می‌شود. فعلا اعتبار دستی برای تست MVP حفظ شده است.
      </p>

      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/35 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{getUserDisplayName(user)}</p>
              <p className="truncate text-xs text-muted" dir="ltr">{getUserIdentifier(user)}</p>
            </div>
            <CreditsForm userId={user.id} credits={user.credits} />
          </div>
        ))}
      </div>
    </Surface>
  );
}
