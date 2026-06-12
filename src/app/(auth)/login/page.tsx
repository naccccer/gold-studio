import { AuthEntry } from "@/features/auth/components/auth-form";
import { completeSignupAction, loginAction, sendSignupOtpAction } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <AuthEntry
      loginAction={loginAction}
      sendSignupAction={sendSignupOtpAction}
      verifySignupAction={completeSignupAction}
    />
  );
}
