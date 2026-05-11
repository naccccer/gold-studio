import { Lock } from "vuesax-icons-react";
import { Button } from "@/components/ui/button";
import { AccountSubpage, accountCardClass, accountInputClass } from "@/features/account/components/account-subpage";
import { changePasswordAction } from "@/features/account/actions";

export default function AccountSecurityPage() {
  return (
    <AccountSubpage title="امنیت حساب">
      <form action={changePasswordAction} className={`${accountCardClass} space-y-3`}>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
            <Lock aria-hidden={true} className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">تغییر رمز عبور</h2>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">رمز فعلی</span>
          <input name="currentPassword" type="password" minLength={6} required dir="ltr" className={`${accountInputClass} text-left`} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">رمز جدید</span>
          <input name="newPassword" type="password" minLength={6} required dir="ltr" className={`${accountInputClass} text-left`} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">تکرار رمز جدید</span>
          <input name="confirmPassword" type="password" minLength={6} required dir="ltr" className={`${accountInputClass} text-left`} />
        </label>
        <Button type="submit" size="full" className="h-11 rounded-[0.95rem]">
          تغییر رمز عبور
        </Button>
      </form>
    </AccountSubpage>
  );
}
