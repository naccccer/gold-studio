"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type InputHTMLAttributes, type KeyboardEvent } from "react";
import {
  Eye,
  EyeSlash,
  Key,
  Lock,
  LoginCurve,
  Mobile,
  PasswordCheck,
  UserAdd,
  type Icon,
} from "vuesax-icons-react";
import { Button } from "@/components/ui/button";
import type { AuthFormState, OtpFormState } from "@/features/auth/actions";

const PASSWORD_MIN_LENGTH = 6;
const OTP_CODE_LENGTH = 6;
const AUTH_FIELD_SHELL_CLASS =
  "rounded-[var(--radius-md)] border border-border bg-white px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition focus-within:border-accent focus-within:shadow-[var(--shadow-focus)]";
const AUTH_ICON_COLOR = "#837868";

function useSecondCountdown(initialSeconds = 0) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) return;

    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [remaining]);

  return remaining;
}

function LiveOtpDelayMessage({ initialSeconds, fallback }: { initialSeconds: number; fallback: string }) {
  const remaining = useSecondCountdown(initialSeconds);

  return (
    <>
      {remaining > 0
        ? `کد قبلی هنوز معتبر است. ${remaining.toLocaleString("fa-IR")} ثانیه دیگر برای ارسال کد جدید صبر کنید.`
        : fallback}
    </>
  );
}

function normalizeCodeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  dir?: "rtl" | "ltr";
  icon: Icon;
};

type OtpFlowProps = {
  sendAction: (formData: FormData) => void;
  verifyAction: (formData: FormData) => void;
  sendState: OtpFormState;
  verifyState: OtpFormState;
  sendPending: boolean;
  verifyPending: boolean;
};

function AuthField({ label, icon: Icon, dir = "rtl", ...props }: AuthFieldProps) {
  return (
    <label className={`block ${AUTH_FIELD_SHELL_CLASS}`}>
      <span className="mb-2 block text-right text-xs font-semibold leading-none text-muted-strong">
        {label}
      </span>
      <span className="flex h-8 items-center gap-2.5" dir="ltr">
        <Icon aria-hidden="true" size={18} color={AUTH_ICON_COLOR} variant="Linear" className="shrink-0" />
        <input
          {...props}
          dir={dir}
          className={[
            "auth-text-input h-full min-w-0 flex-1 bg-transparent text-sm font-semibold leading-none text-foreground outline-none placeholder:font-normal",
            dir === "ltr" ? "text-left" : "text-right",
          ].join(" ")}
        />
      </span>
    </label>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
}: {
  label: string;
  name: string;
  autoComplete: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={AUTH_FIELD_SHELL_CLASS}>
      <div className="mb-2 text-right text-xs font-semibold leading-none text-muted-strong">
        {label}
      </div>
      <div className="flex h-8 items-center gap-2.5" dir="ltr">
        <Lock aria-hidden="true" size={18} color={AUTH_ICON_COLOR} variant="Linear" className="shrink-0" />
        <input
          required
          name={name}
          minLength={PASSWORD_MIN_LENGTH}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          dir="ltr"
          className="auth-text-input h-full min-w-0 flex-1 bg-transparent text-left text-sm font-semibold leading-none text-foreground outline-none"
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
        >
          {showPassword ? (
            <EyeSlash aria-hidden="true" size={17} color="currentColor" variant="Linear" />
          ) : (
            <Eye aria-hidden="true" size={17} color="currentColor" variant="Linear" />
          )}
        </button>
      </div>
    </div>
  );
}

function FormMessage({ state, showSuccess = true }: { state: AuthFormState | OtpFormState; showSuccess?: boolean }) {
  const resendDelaySeconds = "resendDelaySeconds" in state ? (state.resendDelaySeconds ?? 0) : 0;

  if (state.error) {
    return (
      <p aria-live="polite" className="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-3 py-2 text-sm font-medium leading-6 text-danger">
        {resendDelaySeconds > 0 ? (
          <LiveOtpDelayMessage
            key={`${"phone" in state ? state.phone ?? "" : ""}:${resendDelaySeconds}`}
            initialSeconds={resendDelaySeconds}
            fallback={state.error}
          />
        ) : (
          state.error
        )}
      </p>
    );
  }

  if (showSuccess && "message" in state && state.message) {
    return (
      <p aria-live="polite" className="rounded-[var(--radius-md)] border border-accent/18 bg-accent-wash px-3 py-2 text-sm font-medium leading-6 text-accent-deep">
        {state.message}
      </p>
    );
  }

  return null;
}

function TransientNotice({ message, noticeId }: { message?: string; noticeId?: string }) {
  if (!message) return null;

  return (
    <div key={noticeId ?? message} className="pointer-events-none relative z-[70] mx-auto mb-3 max-h-16 max-w-[390px] overflow-hidden animate-[ovalaAuthToast_3.8s_ease-out_forwards]">
      <p aria-live="polite" className="motion-reveal-soft rounded-full border border-accent/18 bg-surface px-4 py-2 text-center text-xs font-semibold text-accent-deep shadow-[0_16px_34px_-24px_rgba(17,16,14,0.5)]">
        {message}
      </p>
    </div>
  );
}

function OtpCodeField() {
  const [digits, setDigits] = useState<string[]>(Array.from({ length: OTP_CODE_LENGTH }, () => ""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join("");

  function setCodeValue(value: string, focusIndex?: number) {
    const nextDigits = normalizeCodeDigits(value).slice(0, OTP_CODE_LENGTH).padEnd(OTP_CODE_LENGTH, " ").split("").map((digit) => digit.trim());
    setDigits(nextDigits);
    const nextFocusIndex = Math.min(focusIndex ?? normalizeCodeDigits(value).length, OTP_CODE_LENGTH - 1);
    window.requestAnimationFrame(() => inputRefs.current[nextFocusIndex]?.focus());
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const value = normalizeCodeDigits(event.target.value);
    if (value.length > 1) {
      setCodeValue(value, Math.min(index + value.length, OTP_CODE_LENGTH - 1));
      return;
    }

    setDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });

    if (value && index < OTP_CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      setDigits((current) => {
        const next = [...current];
        next[index - 1] = "";
        return next;
      });
    }

    if (event.key === "ArrowLeft" && index < OTP_CODE_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }

    if (event.key === "ArrowRight" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = normalizeCodeDigits(event.clipboardData.getData("text"));
    if (!pasted) return;
    event.preventDefault();
    setCodeValue(pasted, Math.min(pasted.length, OTP_CODE_LENGTH - 1));
  }

  return (
    <div className="space-y-2.5">
      <input type="hidden" name="code" value={code} />
      <div className="grid grid-cols-6 gap-2.5" dir="ltr">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            value={digit}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`رقم ${index + 1} کد تایید`}
            maxLength={1}
            required
            onChange={(event) => handleChange(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className="auth-text-input h-12 w-full rounded-[var(--radius-md)] border border-border bg-white text-center text-lg font-semibold leading-none text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-accent focus:shadow-[var(--shadow-focus)]"
          />
        ))}
      </div>
    </div>
  );
}

function SubmitButton({
  pending,
  pendingLabel,
  label,
  icon: Icon,
}: {
  pending: boolean;
  pendingLabel: string;
  label: string;
  icon: Icon;
}) {
  return (
    <Button type="submit" disabled={pending} size="full" className="h-[3.25rem] rounded-[var(--radius-md)]">
      <span className="text-center">{pending ? pendingLabel : label}</span>
      <Icon aria-hidden="true" size={18} color="currentColor" variant="Linear" />
    </Button>
  );
}

function ResendButton({
  initialSeconds,
  sendPending,
  formAction,
}: {
  initialSeconds: number;
  sendPending: boolean;
  formAction?: (formData: FormData) => void;
}) {
  const remaining = useSecondCountdown(initialSeconds);
  const disabled = sendPending || remaining > 0;

  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={disabled}
      className="shrink-0 whitespace-nowrap transition hover:text-foreground disabled:opacity-60"
    >
      {sendPending
        ? "در حال ارسال..."
        : remaining > 0
          ? `ارسال دوباره کد (${remaining.toLocaleString("fa-IR")} ثانیه)`
          : "ارسال دوباره کد"}
    </button>
  );
}

function ResendForm({
  phone,
  sendAction,
  sendPending,
  resendDelaySeconds = 0,
  nested = false,
}: {
  phone: string;
  sendAction: (formData: FormData) => void;
  sendPending: boolean;
  resendDelaySeconds?: number;
  nested?: boolean;
}) {
  const content = (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface-soft/70 px-3 py-2 text-[11px] font-semibold leading-5 text-muted">
      <input type="hidden" name="phone" value={phone} />
      <p className="min-w-0 truncate">
        کد تایید برای <span dir="ltr" className="inline-block text-foreground">{phone}</span> ارسال شده است.
      </p>
      <ResendButton
        key={`${phone}:${resendDelaySeconds}`}
        initialSeconds={resendDelaySeconds}
        sendPending={sendPending}
        formAction={nested ? sendAction : undefined}
      />
    </div>
  );

  if (nested) return content;

  return <form action={sendAction}>{content}</form>;
}

export function LoginFormContent({
  action,
  state,
  pending,
  onForgotPassword,
}: {
  action: (formData: FormData) => void;
  state: AuthFormState;
  pending: boolean;
  onForgotPassword?: () => void;
}) {
  return (
    <form action={action} className="space-y-3">
      <AuthField
        label="موبایل"
        name="loginIdentifier"
        type="text"
        autoComplete="username"
        placeholder="0912 123 45 67"
        dir="ltr"
        icon={Mobile}
        required
      />

      <PasswordField label="رمز عبور" name="password" autoComplete="current-password" />

      <FormMessage state={state} />

      <SubmitButton pending={pending} pendingLabel="چند لحظه..." label="ورود" icon={LoginCurve} />

      <div className="px-1 pt-1 text-left text-xs font-semibold text-muted">
        {onForgotPassword ? (
          <button type="button" onClick={onForgotPassword} className="transition hover:text-foreground">
            فراموشی رمز
          </button>
        ) : (
          <Link href="/forgot-password" className="transition hover:text-foreground">
            فراموشی رمز
          </Link>
        )}
      </div>
    </form>
  );
}

export function SignupFormContent({
  sendAction,
  verifyAction,
  sendState,
  verifyState,
  sendPending,
  verifyPending,
}: OtpFlowProps) {
  const activeState = verifyState.step === "verify" || verifyState.step === "password" ? verifyState : sendState;
  const phone = activeState.phone ?? sendState.phone ?? "";
  const resendDelaySeconds = sendState.resendDelaySeconds ?? activeState.resendDelaySeconds ?? 0;

  if (activeState.step === "password" && phone && activeState.signupProof) {
    return (
      <div className="space-y-3">
        <TransientNotice message={activeState.message} noticeId={`${phone}:password`} />

        <form action={verifyAction} className="space-y-3">
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="signupProof" value={activeState.signupProof} />
          <PasswordField label="رمز عبور" name="password" autoComplete="new-password" />

          <FormMessage state={activeState} showSuccess={false} />

          <SubmitButton
            pending={verifyPending}
            pendingLabel="چند لحظه..."
            label="تکمیل ثبت‌نام"
            icon={PasswordCheck}
          />
        </form>
      </div>
    );
  }

  if (activeState.step === "verify" && phone) {
    return (
      <div className="space-y-3">
        <TransientNotice message={activeState.message} noticeId={`${phone}:${resendDelaySeconds}`} />

        <form action={verifyAction} className="space-y-3">
          <input type="hidden" name="phone" value={phone} />
          <OtpCodeField />

          <FormMessage state={activeState} showSuccess={false} />

          <ResendForm
            phone={phone}
            sendAction={sendAction}
            sendPending={sendPending}
            resendDelaySeconds={resendDelaySeconds}
            nested
          />

          <SubmitButton
            pending={verifyPending}
            pendingLabel="چند لحظه..."
            label="ادامه"
            icon={Key}
          />
        </form>
      </div>
    );
  }

  return (
    <form action={sendAction} className="space-y-3">
      <AuthField
        label="موبایل"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0912 123 45 67"
        defaultValue={phone}
        dir="ltr"
        icon={Mobile}
        required
      />

      <FormMessage state={activeState} />

      <SubmitButton
        pending={sendPending}
        pendingLabel="در حال ارسال..."
        label="دریافت کد تایید"
        icon={UserAdd}
      />
    </form>
  );
}

export function ResetFormContent({
  sendAction,
  verifyAction,
  sendState,
  verifyState,
  sendPending,
  verifyPending,
}: OtpFlowProps) {
  const activeState = verifyState.step === "verify" ? verifyState : sendState;
  const phone = activeState.phone ?? sendState.phone ?? "";
  const resendDelaySeconds = sendState.resendDelaySeconds ?? activeState.resendDelaySeconds ?? 0;

  if (activeState.step === "verify" && phone) {
    return (
      <div className="space-y-3">
        <p className="rounded-[var(--radius-md)] bg-surface-soft px-3 py-2 text-xs font-medium leading-6 text-muted-strong">
          کد تایید برای <span dir="ltr" className="inline-block font-semibold text-foreground">{phone}</span> ارسال شده است.
        </p>

        <form action={verifyAction} className="space-y-3">
          <input type="hidden" name="phone" value={phone} />
          <AuthField
            label="کد تایید"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            dir="ltr"
            icon={Key}
            required
          />
          <PasswordField label="رمز جدید" name="password" autoComplete="new-password" />
          <PasswordField label="تکرار رمز جدید" name="confirmPassword" autoComplete="new-password" />

          <FormMessage state={activeState} />

          <SubmitButton
            pending={verifyPending}
            pendingLabel="چند لحظه..."
            label="تغییر رمز عبور"
            icon={PasswordCheck}
          />
        </form>

        <ResendForm phone={phone} sendAction={sendAction} sendPending={sendPending} resendDelaySeconds={resendDelaySeconds} />
      </div>
    );
  }

  return (
    <form action={sendAction} className="space-y-3">
      <AuthField
        label="موبایل"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0912 123 45 67"
        defaultValue={phone}
        dir="ltr"
        icon={Mobile}
        required
      />

      <FormMessage state={activeState} />

      <SubmitButton
        pending={sendPending}
        pendingLabel="در حال ارسال..."
        label="دریافت کد تایید"
        icon={Key}
      />

      <p className="text-center text-xs font-medium leading-6 text-muted">
        بعد از تایید موبایل، رمز جدید را وارد می‌کنید.
      </p>
    </form>
  );
}
