import { AuthForm } from "@/features/auth/components/auth-form";
import { signupAction } from "@/features/auth/actions";

export default function SignupPage() {
  return (
    <AuthForm
      title="ساخت حساب جدید"
      description="حساب خود را بسازید و شروع کنید."
      action={signupAction}
      submitLabel="ساخت حساب"
      showName
      secondaryHref="/login"
      secondaryLabel="قبلا ثبت‌نام کرده‌ام"
    />
  );
}
