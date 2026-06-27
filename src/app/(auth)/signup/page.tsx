import { AuthEntryStage } from "@/features/auth/components/auth-entry-stage";
import {
  completeSignupAction,
  loginAction,
  resetPasswordWithOtpAction,
  sendPasswordResetOtpAction,
  sendSignupOtpAction,
} from "@/features/auth/actions";
import { getCurrentVertical } from "@/lib/current-vertical";
import { getVerticalContent } from "@/lib/vertical-content";

export default async function SignupPage() {
  const vertical = await getCurrentVertical();
  const content = getVerticalContent(vertical);

  return (
    <AuthEntryStage
      initialPanel="signup"
      vertical={vertical}
      hint={content.authHint}
      loginAction={loginAction}
      sendSignupAction={sendSignupOtpAction}
      verifySignupAction={completeSignupAction}
      sendResetAction={sendPasswordResetOtpAction}
      verifyResetAction={resetPasswordWithOtpAction}
    />
  );
}
