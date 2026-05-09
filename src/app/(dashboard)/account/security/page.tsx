import { Button } from "@/components/ui/button";
import { changePasswordAction } from "@/features/account/actions";
import { AccountSubpage, accountCardClass, accountInputClass } from "@/features/account/components/account-subpage";

export default function AccountSecurityPage() {
  return (
    <AccountSubpage title="امنیت حساب" caption="برای تغییر رمز، رمز فعلی و رمز جدید را وارد کنید.">
      <form action={changePasswordAction} className={`${accountCardClass} space-y-3`}>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">رمز فعلی</span>
          <input name="currentPassword" type="password" minLength={6} dir="ltr" className={`${accountInputClass} text-left`} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">رمز جدید</span>
          <input name="newPassword" type="password" minLength={6} dir="ltr" className={`${accountInputClass} text-left`} />
        </label>
        <Button type="submit" size="full" className="h-11 rounded-[0.95rem]">
          تغییر رمز عبور
        </Button>
      </form>
    </AccountSubpage>
  );
}
