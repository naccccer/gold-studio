import { OtpAuthForm } from "@/features/auth/components/auth-form";
import { resetPasswordWithOtpAction, sendPasswordResetOtpAction } from "@/features/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <OtpAuthForm
      mode="forgot-password"
      title="بازیابی رمز عبور"
      sendAction={sendPasswordResetOtpAction}
      verifyAction={resetPasswordWithOtpAction}
    />
  );
}
