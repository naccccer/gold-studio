"use client";

import Link from "next/link";
import { ArrowLeft, Eye, Lock, LogIn, UserPlus } from "lucide-react";
import { useActionState } from "react";
import { AuthImageBackdrop } from "@/components/ui/auth-image-backdrop";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
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
      <AuthImageBackdrop src={authHeroImage} priority imageClassName="object-[50%_38%]" />
      <section className="relative mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-20 sm:px-5 sm:pb-6 sm:pt-20">
        <div className="flex h-[72px] items-center justify-center">
          <BrandLogo variant="primary" priority className="drop-shadow-[0_16px_34px_rgba(0,0,0,0.22)]" />
        </div>

        <form
          action={formAction}
          className="mb-20 mt-auto space-y-2.5 rounded-[1.3rem] border border-white/46 bg-surface/50 px-4 pb-3.5 pt-3 shadow-[0_28px_70px_-42px_rgba(17,16,14,0.85)] backdrop-blur-lg"
        >
          <Field label="موبایل / ایمیل" className="space-y-1">
            <input
              required
              name="loginIdentifier"
              type="text"
              inputMode="email"
              autoComplete="username"
              dir="ltr"
              placeholder="0912 456 7890"
              className={`${fieldControlClassName} h-10 text-left [unicode-bidi:isolate]`}
            />
          </Field>

          <Field label="رمز عبور" className="space-y-1">
            <div className="relative">
              <input
                required
                name="password"
                minLength={6}
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                dir="ltr"
                className={`${fieldControlClassName} h-10 pl-10 text-left`}
              />
              {isSignup ? (
                <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.6} />
              ) : (
                <Eye aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.6} />
              )}
            </div>
          </Field>

          {state.error ? (
            <p className="rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} size="full" className="mt-1 h-11">
            <SubmitIcon aria-hidden="true" className="h-4 w-4" />
            {pending ? "چند لحظه..." : submitLabel}
          </Button>

          <p className="text-center text-xs text-muted">
            {mode === "login" ? `${secondaryPrefix} ` : null}
            <Link href={secondaryHref} className="inline-flex items-center gap-1 font-semibold text-foreground">
              {secondaryLabel}
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
