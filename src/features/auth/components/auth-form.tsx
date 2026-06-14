"use client";

import Link from "next/link";
import { useEffect, useState, type InputHTMLAttributes } from "react";
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
    <label className="block rounded-[var(--radius-md)] border border-border bg-white px-3.5 py-3 transition focus-within:border-accent focus-within:shadow-[var(--shadow-focus)]">
      <span className="mb-2 block text-right text-xs font-semibold leading-none text-muted-strong">
        {label}
      </span>
      <span className="flex h-8 items-center gap-2.5" dir="ltr">
        <Icon aria-hidden="true" size={18} color="#837868" variant="Linear" className="shrink-0" />
        <input
          {...props}
          dir={dir}
          className={[
            "auth-text-input h-full min-w-0 flex-1 bg-transparent text-sm font-semibold leading-none text-foreground outline-none placeholder:font-normal placeholder:text-muted",
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
    <div className="rounded-[var(--radius-md)] border border-border bg-white px-3.5 py-3 transition focus-within:border-accent focus-within:shadow-[var(--shadow-focus)]">
      <div className="mb-2 text-right text-xs font-semibold leading-none text-muted-strong">
        {label}
      </div>
      <div className="flex h-8 items-center gap-2.5" dir="ltr">
        <Lock aria-hidden="true" size={18} color="#837868" variant="Linear" className="shrink-0" />
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

function FormMessage({ state }: { state: AuthFormState | OtpFormState }) {
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

  if ("message" in state && state.message) {
    return (
      <p aria-live="polite" className="rounded-[var(--radius-md)] border border-accent/18 bg-accent-wash px-3 py-2 text-sm font-medium leading-6 text-accent-deep">
        {state.message}
      </p>
    );
  }

  return null;
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

function ResendButton({ initialSeconds, sendPending }: { initialSeconds: number; sendPending: boolean }) {
  const remaining = useSecondCountdown(initialSeconds);
  const disabled = sendPending || remaining > 0;

  return (
    <button type="submit" disabled={disabled} className="transition hover:text-foreground disabled:opacity-60">
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
}: {
  phone: string;
  sendAction: (formData: FormData) => void;
  sendPending: boolean;
  resendDelaySeconds?: number;
}) {
  return (
    <form action={sendAction} className="px-1 text-xs font-semibold text-muted">
      <input type="hidden" name="phone" value={phone} />
      <ResendButton key={`${phone}:${resendDelaySeconds}`} initialSeconds={resendDelaySeconds} sendPending={sendPending} />
    </form>
  );
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
        placeholder="0912 456 7890"
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
          <PasswordField label="رمز عبور" name="password" autoComplete="new-password" />
          <PasswordField label="تکرار رمز عبور" name="confirmPassword" autoComplete="new-password" />

          <FormMessage state={activeState} />

          <SubmitButton
            pending={verifyPending}
            pendingLabel="چند لحظه..."
            label="تکمیل ثبت‌نام"
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
        placeholder="0912 456 7890"
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
        placeholder="0912 456 7890"
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
