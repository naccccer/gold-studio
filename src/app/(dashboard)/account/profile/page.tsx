import { ProfileCircle } from "vuesax-icons-react";
import { Button } from "@/components/ui/button";
import {
  AccountInfoRow,
  AccountSubpage,
  accountCardClass,
  accountInputClass,
} from "@/features/account/components/account-subpage";
import { updateProfileAction } from "@/features/account/actions";
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
    <AccountSubpage title="مشخصات حساب">
      <section className={`${accountCardClass} space-y-2`}>
        <AccountInfoRow label="نام فعلی" value={user?.name ?? "ثبت نشده"} />
        <AccountInfoRow label="ایمیل" value={user?.email ?? "ثبت نشده"} valueClassName="text-left text-xs sm:text-sm" />
        <AccountInfoRow label="موبایل" value={user?.phone ?? "ثبت نشده"} valueClassName="text-left text-xs sm:text-sm" />
      </section>

      <form action={updateProfileAction} className={`${accountCardClass} space-y-3`}>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
            <ProfileCircle aria-hidden={true} className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">ویرایش مشخصات</h2>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">نام نمایشی</span>
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
