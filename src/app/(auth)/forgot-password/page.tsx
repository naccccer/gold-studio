import { AuthEntryStage } from "@/features/auth/components/auth-entry-stage";
import {
  completeSignupAction,
  loginAction,
  resetPasswordWithOtpAction,
  sendPasswordResetOtpAction,
  sendSignupOtpAction,
} from "@/features/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <AuthEntryStage
      initialPanel="reset"
      loginAction={loginAction}
      sendSignupAction={sendSignupOtpAction}
      verifySignupAction={completeSignupAction}
      sendResetAction={sendPasswordResetOtpAction}
      verifyResetAction={resetPasswordWithOtpAction}
    />
  );
}
