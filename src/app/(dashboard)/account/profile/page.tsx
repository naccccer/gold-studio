import { Button } from "@/components/ui/button";
import { AccountDisclosureCard } from "@/features/account/components/account-disclosure-card";
import { AccountPasswordInput } from "@/features/account/components/account-password-input";
import {
  AccountInfoRow,
  AccountSubpage,
  accountCardClass,
  accountInputClass,
} from "@/features/account/components/account-subpage";
import { changePasswordAction, updateProfileAction } from "@/features/account/actions";
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
    <AccountSubpage title="حساب کاربری">
      <section className={`${accountCardClass} space-y-2`}>
        <AccountInfoRow label="نام فعلی" value={user?.name ?? "ثبت نشده"} />
        <AccountInfoRow label="ایمیل" value={user?.email ?? "ثبت نشده"} valueClassName="text-left text-xs sm:text-sm" />
        <AccountInfoRow label="موبایل" value={user?.phone ?? "ثبت نشده"} valueClassName="text-left text-xs sm:text-sm" />
      </section>

      <form action={updateProfileAction}>
        <AccountDisclosureCard title="ویرایش مشخصات" icon="profile">
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
        </AccountDisclosureCard>
      </form>

      <form action={changePasswordAction}>
        <AccountDisclosureCard title="تغییر رمز عبور" icon="lock">
          <AccountPasswordInput label="رمز فعلی" name="currentPassword" autoComplete="current-password" />
          <AccountPasswordInput label="رمز جدید" name="newPassword" autoComplete="new-password" />
          <AccountPasswordInput label="تکرار رمز جدید" name="confirmPassword" autoComplete="new-password" />
          <Button type="submit" size="full" className="h-11 rounded-[0.95rem]">
            تغییر رمز عبور
          </Button>
        </AccountDisclosureCard>
      </form>
    </AccountSubpage>
  );
}
