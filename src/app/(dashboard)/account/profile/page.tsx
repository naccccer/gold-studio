import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/features/account/actions";
import { AccountSubpage, accountCardClass, accountInputClass } from "@/features/account/components/account-subpage";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await requireUserSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, phone: true },
  });

  return (
    <AccountSubpage title="مشخصات" caption="نام نمایشی، ایمیل و شماره موبایل حساب را به‌روز نگه دارید.">
      <form action={updateProfileAction} className={`${accountCardClass} space-y-3`}>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">نام</span>
          <input name="name" defaultValue={user?.name ?? ""} className={accountInputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">ایمیل</span>
          <input name="email" defaultValue={user?.email ?? ""} dir="ltr" className={`${accountInputClass} text-left`} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">موبایل</span>
          <input name="phone" defaultValue={user?.phone ?? ""} dir="ltr" className={`${accountInputClass} text-left`} />
        </label>
        <Button type="submit" size="full" className="h-11 rounded-[0.95rem]">
          ذخیره مشخصات
        </Button>
      </form>
    </AccountSubpage>
  );
}
