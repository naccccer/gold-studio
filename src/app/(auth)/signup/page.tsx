import { AuthEntryStage } from "@/features/auth/components/auth-entry-stage";
import { completeSignupAction, loginAction, sendSignupOtpAction } from "@/features/auth/actions";

export default function SignupPage() {
  return (
    <AuthEntryStage
      initialPanel="signup"
      loginAction={loginAction}
      sendSignupAction={sendSignupOtpAction}
      verifySignupAction={completeSignupAction}
    />
  );
}
