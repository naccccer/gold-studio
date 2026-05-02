import { AuthForm } from "@/features/auth/components/auth-form";
import { loginAction } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <AuthForm
      title="ورود"
      description="برای ادامه وارد استودیوی خود شوید."
      action={loginAction}
      submitLabel="ورود"
      secondaryHref="/signup"
      secondaryLabel="ساخت حساب"
    />
  );
}
