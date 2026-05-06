import { AuthForm } from "@/features/auth/components/auth-form";
import { loginAction } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <AuthForm
      title="ورود"
      action={loginAction}
      submitLabel="ورود به استودیو"
      mode="login"
      secondaryHref="/signup"
      secondaryLabel="ساخت حساب"
      secondaryPrefix="حساب ندارید؟"
    />
  );
}
