"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Eye, EyeSlash, LoginCurve, UserAdd, UserSearch, type Icon } from "vuesax-icons-react";
import { AuthImageBackdrop } from "@/components/ui/auth-image-backdrop";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import type { AuthFormState } from "@/features/auth/actions";

type AuthFormProps = {
  title: string;
  action: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  mode: "login" | "signup";
  secondaryHref: string;
  secondaryLabel: string;
  secondaryPrefix: string;
};

const INITIAL_STATE: AuthFormState = {};
const PASSWORD_MIN_LENGTH = 6;
const authHeroImage = "/images/placeholders/jewelry/auth-hero-ring-01.webp";

type AuthFieldProps = {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  placeholder?: string;
  dir?: "rtl" | "ltr";
  icon: Icon;
};

function AuthField({ label, icon: Icon, dir = "rtl", ...props }: AuthFieldProps) {
  return (
    <label className="block rounded-[1.05rem] border border-white/76 bg-surface/68 px-3.5 py-3 shadow-[0_16px_36px_-34px_rgba(17,16,14,0.65)]">
      <span className="mb-1.5 block text-right text-[11px] font-medium text-[#918575]">
        {label}
      </span>
      <span className="flex h-7 items-center gap-2" dir="ltr">
        <Icon aria-hidden="true" size={16} color="#9a8f80" variant="Linear" className="shrink-0" />
        <input
          {...props}
          dir={dir}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold leading-none text-[#24201b] outline-none placeholder:font-normal placeholder:text-[#8b8173]"
        />
      </span>
    </label>
  );
}

export function AuthForm({
  action,
  submitLabel,
  mode,
  secondaryHref,
  secondaryLabel,
  secondaryPrefix,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";
  const SubmitIcon = isSignup ? UserAdd : LoginCurve;

  return (
    <main className="flex min-h-svh justify-center overflow-hidden bg-[#efe6d8] text-right text-foreground md:bg-[radial-gradient(circle_at_top,#fffaf0_0%,#f6f1e8_42%,#e8dece_100%)] md:py-6">
      <section className="relative flex h-svh w-full max-w-[393px] flex-col overflow-hidden bg-[#11100e] px-5 pb-5 pt-5 md:h-[calc(100svh-3rem)] md:max-w-[430px] md:rounded-[2rem] md:border md:border-white/80 md:shadow-[0_30px_80px_-52px_rgba(23,20,17,0.65)]">
        <AuthImageBackdrop src={authHeroImage} priority imageClassName="object-[50%_38%]" />
        <div className="relative z-10 flex h-[86px] items-center justify-center pt-10">
          <BrandLogo variant="primary" priority />
        </div>

        <form action={formAction} className="relative z-10 mt-auto space-y-3 pb-1">
          <AuthField
            label="موبایل / ایمیل"
            name="loginIdentifier"
            type="text"
            autoComplete="username"
            placeholder="0912 456 7890"
            dir="ltr"
            icon={UserSearch}
          />

          <div className="rounded-[1.05rem] border border-white/76 bg-surface/68 px-3.5 py-3 shadow-[0_16px_36px_-34px_rgba(17,16,14,0.65)]">
            <div className="mb-1.5 text-right text-[11px] font-medium text-[#918575]">
              رمز عبور
            </div>
            <div className="flex h-7 items-center gap-2" dir="ltr">
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8b8173] transition hover:bg-[#eee7dc] hover:text-[#24201b]"
              >
                {showPassword ? (
                  <EyeSlash aria-hidden="true" size={16} color="currentColor" variant="Linear" />
                ) : (
                  <Eye aria-hidden="true" size={16} color="currentColor" variant="Linear" />
                )}
              </button>
              <input
                required
                name="password"
                minLength={PASSWORD_MIN_LENGTH}
                type={showPassword ? "text" : "password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                dir="ltr"
                className="h-full min-w-0 flex-1 bg-transparent text-left text-sm font-semibold leading-none text-[#24201b] outline-none"
              />
            </div>
          </div>

          {state.error ? (
            <p className="rounded-[1rem] border border-danger/30 bg-danger-soft/92 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          ) : null}

          <div className="pt-1">
            <Button type="submit" disabled={pending} size="full" className="h-12 rounded-[1rem]">
              {pending ? "چند لحظه..." : submitLabel}
              <SubmitIcon aria-hidden="true" size={16} color="currentColor" variant="Linear" />
            </Button>
          </div>

          {mode === "login" ? (
            <div className="flex items-center justify-between px-1 text-xs font-medium text-surface/78">
              <Link href={secondaryHref} className="inline-flex items-center gap-1 text-surface transition hover:text-surface/82">
                <span>{secondaryLabel}</span>
                <ArrowLeft aria-hidden="true" size={14} color="currentColor" variant="Linear" />
              </Link>
              <span className="text-surface/72">فراموشی رمز</span>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <p className="text-center text-[11px] leading-5 text-surface/78">
                رمز عبور باید حداقل ۶ کاراکتر باشد.
              </p>
              <p className="text-center text-xs font-medium text-surface/82">
                {secondaryPrefix}{" "}
                <Link href={secondaryHref} className="inline-flex items-center gap-1 text-surface">
                  {secondaryLabel}
                  <ArrowLeft aria-hidden="true" size={14} color="currentColor" variant="Linear" />
                </Link>
              </p>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
