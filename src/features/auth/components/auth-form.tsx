"use client";

import Link from "next/link";
import { useActionState, useState, type InputHTMLAttributes, type ReactNode } from "react";
import {
  ArrowLeft,
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
import { AuthImageBackdrop } from "@/components/ui/auth-image-backdrop";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import type { AuthFormState, OtpFormState } from "@/features/auth/actions";

type AuthFormProps = {
  title: string;
  description?: string;
  action: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  secondaryPrefix: string;
};

type OtpAuthFormProps = {
  mode: "signup" | "forgot-password";
  title: string;
  description?: string;
  sendAction: (prevState: OtpFormState, formData: FormData) => Promise<OtpFormState>;
  verifyAction: (prevState: OtpFormState, formData: FormData) => Promise<OtpFormState>;
};

const INITIAL_AUTH_STATE: AuthFormState = {};
const INITIAL_OTP_STATE: OtpFormState = { step: "phone" };
const PASSWORD_MIN_LENGTH = 6;
const authHeroImage = "/images/placeholders/jewelry/auth-hero-ring-01.webp";

type AuthShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  dir?: "rtl" | "ltr";
  icon: Icon;
};

function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex min-h-svh justify-center overflow-hidden bg-[#eee5d8] text-right text-foreground md:bg-[radial-gradient(circle_at_top,#fffaf3_0%,#f5efe5_48%,#e7dccc_100%)] md:py-6">
      <section className="relative isolate flex min-h-svh w-full max-w-[430px] flex-col overflow-hidden bg-[#f4eee5] px-5 pb-5 pt-5 md:min-h-[820px] md:rounded-[1.5rem] md:border md:border-white/75 md:shadow-[0_18px_42px_-32px_rgba(23,20,17,0.62)]">
        <AuthImageBackdrop src={authHeroImage} priority imageClassName="object-[50%_34%]" />

        <header className="relative z-10 flex h-[92px] items-start justify-center pt-4">
          <BrandLogo variant="primary" priority />
        </header>

        <div className="relative z-10 flex flex-1 items-center pb-[max(0rem,env(safe-area-inset-bottom))]">
          <div className="w-full rounded-[var(--radius-lg)] border border-white/85 bg-surface/95 p-4 shadow-[0_14px_30px_-26px_rgba(23,20,17,0.55)]">
            <div className="mb-4">
              <h1 className="text-right text-[1.2rem] font-semibold leading-8 text-foreground">
                {title}
              </h1>
              {description ? (
                <p className="mt-1.5 max-w-[30rem] text-right text-xs font-medium leading-6 text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

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
  if (state.error) {
    return (
      <p aria-live="polite" className="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-3 py-2 text-sm font-medium leading-6 text-danger">
        {state.error}
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

export function LoginFormContent({
  action,
  state,
  pending,
}: {
  action: (formData: FormData) => void;
  state: AuthFormState;
  pending: boolean;
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
        <Link href="/forgot-password" className="transition hover:text-foreground">
          فراموشی رمز
        </Link>
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
}: {
  sendAction: (formData: FormData) => void;
  verifyAction: (formData: FormData) => void;
  sendState: OtpFormState;
  verifyState: OtpFormState;
  sendPending: boolean;
  verifyPending: boolean;
}) {
  const activeState = verifyState.step === "verify" ? verifyState : sendState;
  const phone = activeState.phone ?? sendState.phone ?? "";

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

        <form action={sendAction} className="px-1 text-xs font-semibold text-muted">
          <input type="hidden" name="phone" value={phone} />
          <button type="submit" disabled={sendPending} className="transition hover:text-foreground disabled:opacity-60">
            {sendPending ? "در حال ارسال..." : "ارسال دوباره کد"}
          </button>
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

export function AuthForm({
  title,
  description,
  action,
  submitLabel,
  secondaryHref,
  secondaryLabel,
  secondaryPrefix,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_AUTH_STATE);

  return (
    <AuthShell title={title} description={description}>
      <form action={formAction} className="space-y-3">
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

        <SubmitButton pending={pending} pendingLabel="چند لحظه..." label={submitLabel} icon={LoginCurve} />

        <div className="flex items-center justify-between gap-3 px-1 pt-1 text-xs font-semibold text-muted">
          <Link href="/forgot-password" className="transition hover:text-foreground">
            فراموشی رمز
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <span>{secondaryPrefix}</span>
            <Link href={secondaryHref} className="inline-flex items-center gap-1 text-foreground transition hover:text-accent-deep">
              <span>{secondaryLabel}</span>
              <ArrowLeft aria-hidden="true" size={14} color="currentColor" variant="Linear" />
            </Link>
          </span>
        </div>
      </form>
    </AuthShell>
  );
}

export function OtpAuthForm({ mode, title, description, sendAction, verifyAction }: OtpAuthFormProps) {
  const [sendState, sendFormAction, sendPending] = useActionState(sendAction, INITIAL_OTP_STATE);
  const [verifyState, verifyFormAction, verifyPending] = useActionState(verifyAction, INITIAL_OTP_STATE);
  const activeState = verifyState.step === "verify" ? verifyState : sendState;
  const phone = activeState.phone ?? sendState.phone ?? "";
  const isSignup = mode === "signup";

  if (activeState.step === "verify" && phone) {
    return (
      <AuthShell title={title} description={description}>
        <div className="space-y-3">
          <p className="rounded-[var(--radius-md)] bg-surface-soft px-3 py-2 text-xs font-medium leading-6 text-muted-strong">
            کد تایید برای <span dir="ltr" className="inline-block font-semibold text-foreground">{phone}</span> ارسال شده است.
          </p>

          <form action={verifyFormAction} className="space-y-3">
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
            <PasswordField label={isSignup ? "رمز عبور" : "رمز جدید"} name="password" autoComplete="new-password" />
            <PasswordField label={isSignup ? "تکرار رمز عبور" : "تکرار رمز جدید"} name="confirmPassword" autoComplete="new-password" />

            <FormMessage state={activeState} />

            <SubmitButton
              pending={verifyPending}
              pendingLabel="چند لحظه..."
              label={isSignup ? "تکمیل ثبت‌نام" : "تغییر رمز عبور"}
              icon={PasswordCheck}
            />
          </form>

          <form action={sendFormAction} className="flex items-center justify-between gap-3 px-1 text-xs font-semibold text-muted">
            <input type="hidden" name="phone" value={phone} />
            <button type="submit" disabled={sendPending} className="transition hover:text-foreground disabled:opacity-60">
              {sendPending ? "در حال ارسال..." : "ارسال دوباره کد"}
            </button>
            <Link href="/login" className="inline-flex items-center gap-1 text-foreground transition hover:text-accent-deep">
              ورود با رمز
              <ArrowLeft aria-hidden="true" size={14} color="currentColor" variant="Linear" />
            </Link>
          </form>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={title} description={description}>
      <form action={sendFormAction} className="space-y-3">
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
          icon={isSignup ? UserAdd : Key}
        />

        <p className="text-center text-xs font-medium leading-6 text-muted">
          {isSignup
            ? "بعد از تایید موبایل، رمز عبور حساب را می‌سازید."
            : "بعد از تایید موبایل، رمز جدید را وارد می‌کنید."}
        </p>
        <p className="text-center text-xs font-semibold text-muted">
          <Link href="/login" className="inline-flex items-center gap-1 text-foreground transition hover:text-accent-deep">
            ورود با رمز عبور
            <ArrowLeft aria-hidden="true" size={14} color="currentColor" variant="Linear" />
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
