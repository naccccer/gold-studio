import { OtpAuthForm } from "@/features/auth/components/auth-form";
import { completeSignupAction, sendSignupOtpAction } from "@/features/auth/actions";

export default function SignupPage() {
  return (
    <OtpAuthForm
      mode="signup"
      title="ثبت‌نام"
      sendAction={sendSignupOtpAction}
      verifyAction={completeSignupAction}
    />
  );
}
