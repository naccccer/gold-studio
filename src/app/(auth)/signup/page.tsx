import { AuthForm } from "@/components/auth/auth-form";
import { signupAction } from "@/features/auth/actions";

export default function SignupPage() {
  return (
    <AuthForm
      title="ساخت حساب جدید"
      description="در کمتر از یک دقیقه حساب بسازید و اولین تصویر را تولید کنید."
      action={signupAction}
      submitLabel="ساخت حساب"
      showName
      secondaryHref="/login"
      secondaryLabel="قبلا ثبت‌نام کرده‌ام"
    />
  );
}
