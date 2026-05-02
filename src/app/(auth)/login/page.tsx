import { AuthForm } from "@/features/auth/components/auth-form";
import { loginAction } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <AuthForm
      title="ورود به حساب"
      description="برای ورود به استودیو حساب خود را باز کنید."
      action={loginAction}
      submitLabel="ورود"
      secondaryHref="/signup"
      secondaryLabel="حساب ندارم، ثبت‌نام"
    />
  );
}
