import { AuthForm } from "@/features/auth/components/auth-form";
import { signupAction } from "@/features/auth/actions";

export default function SignupPage() {
  return (
    <AuthForm
      title="ساخت حساب"
      action={signupAction}
      submitLabel="ساخت حساب"
      mode="signup"
      secondaryHref="/login"
      secondaryLabel="ورود"
      secondaryPrefix="قبلا حساب دارید؟"
    />
  );
}
