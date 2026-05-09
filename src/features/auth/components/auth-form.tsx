"use client";

import Link from "next/link";
import { ArrowLeft, Contact, Eye, Gift, Lock, LogIn, UserPlus } from "lucide-react";
import { useActionState } from "react";
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
const authHeroImage = "/images/placeholders/jewelry/auth-hero-ring-01.webp";

type AuthFieldProps = {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  placeholder?: string;
  dir?: "rtl" | "ltr";
  icon: typeof Contact;
};

function AuthField({ label, icon: Icon, dir = "rtl", ...props }: AuthFieldProps) {
  return (
    <label className="block rounded-[1.05rem] border border-white/76 bg-surface/68 px-3.5 py-3 shadow-[0_16px_36px_-34px_rgba(17,16,14,0.65)]">
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[#918575]">
        <span>{label}</span>
        <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
      </span>
      <input
        {...props}
        dir={dir}
        className="h-6 w-full bg-transparent text-sm font-semibold leading-none text-[#24201b] outline-none placeholder:font-normal placeholder:text-[#8b8173]"
      />
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
  const isSignup = mode === "signup";
  const SubmitIcon = isSignup ? UserPlus : LogIn;

  return (
    <main className="relative h-svh overflow-hidden bg-[#11100e] text-right text-foreground">
      <AuthImageBackdrop src={authHeroImage} priority imageClassName={mode === "login" ? "object-[50%_52%]" : "object-[50%_38%]"} />
      <section className="relative mx-auto flex h-full w-full max-w-[393px] flex-col px-5 pb-5 pt-5">
        <div className="flex h-[78px] items-center justify-center">
          <BrandLogo variant="primary" priority />
        </div>

        <form action={formAction} className="mt-auto space-y-3 pb-1">
          <AuthField
            label="موبایل / ایمیل"
            name="loginIdentifier"
            type="text"
            autoComplete="username"
            placeholder="0912 456 7890"
            dir="ltr"
            icon={Contact}
          />

          <div className="rounded-[1.05rem] border border-white/76 bg-surface/68 px-3.5 py-3 shadow-[0_16px_36px_-34px_rgba(17,16,14,0.65)]">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[#918575]">
              <span>رمز عبور</span>
              <Lock aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <input
                required
                name="password"
                minLength={6}
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                dir="ltr"
                className="h-6 w-full bg-transparent text-left text-sm font-semibold leading-none text-[#24201b] outline-none"
              />
              {!isSignup ? <Eye aria-hidden="true" className="h-4 w-4 shrink-0 text-[#8b8173]" /> : null}
            </div>
          </div>

          {isSignup ? (
            <AuthField
              label="کد معرف"
              name="referralCode"
              type="text"
              autoComplete="off"
              placeholder="GS..."
              dir="ltr"
              icon={Gift}
            />
          ) : null}

          {state.error ? (
            <p className="rounded-[1rem] border border-danger/30 bg-danger-soft/92 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          ) : null}

          <div className="pt-1">
            <Button type="submit" disabled={pending} size="full" className="h-12 rounded-[1rem]">
              {pending ? "چند لحظه..." : submitLabel}
              <SubmitIcon aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>

          {mode === "login" ? (
            <div className="flex items-center justify-between px-1 text-xs font-medium text-[#6d665d]">
              <Link href={secondaryHref} className="inline-flex items-center gap-1">
                <span>{secondaryLabel}</span>
                <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
              <span>فراموشی رمز</span>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <p className="text-center text-[11px] leading-5 text-surface/78">
                با ادامه، قوانین نگهداری امن تصاویر محصول را می‌پذیری.
              </p>
              <p className="text-center text-xs font-medium text-surface/82">
                {secondaryPrefix}{" "}
                <Link href={secondaryHref} className="inline-flex items-center gap-1 text-surface">
                  {secondaryLabel}
                  <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </p>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
