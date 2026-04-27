import { AuthForm } from "@/components/auth/auth-form";
import { loginAction } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <AuthForm
      title="ورود به حساب"
      description="برای ادامه و مدیریت پروژه‌های خود وارد شوید."
      action={loginAction}
      submitLabel="ورود"
      secondaryHref="/signup"
      secondaryLabel="حساب ندارم، ثبت‌نام"
    />
  );
}
