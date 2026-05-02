import { AuthForm } from "@/features/auth/components/auth-form";
import { signupAction } from "@/features/auth/actions";

export default function SignupPage() {
  return (
    <AuthForm
      title="ساخت حساب"
      description="یک حساب بسازید و اولین تصویر استودیویی محصول را آماده کنید."
      action={signupAction}
      submitLabel="شروع"
      showName
      secondaryHref="/login"
      secondaryLabel="قبلا ثبت‌نام کرده‌ام"
    />
  );
}
