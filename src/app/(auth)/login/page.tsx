import { AuthEntryStage } from "@/features/auth/components/auth-entry-stage";
import { completeSignupAction, loginAction, sendSignupOtpAction } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <AuthEntryStage
      loginAction={loginAction}
      sendSignupAction={sendSignupOtpAction}
      verifySignupAction={completeSignupAction}
    />
  );
}
