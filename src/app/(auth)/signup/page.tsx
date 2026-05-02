import { AuthForm } from "@/features/auth/components/auth-form";
import { signupAction } from "@/features/auth/actions";

export default function SignupPage() {
  return (
    <AuthForm
      title="ساخت حساب"
      description="شروع کنید و اولین تصویر استودیویی محصول را بسازید."
      action={signupAction}
      submitLabel="شروع"
      showName
      secondaryHref="/login"
      secondaryLabel="ورود به حساب"
    />
  );
}
