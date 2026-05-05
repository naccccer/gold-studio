"use client";

import Link from "next/link";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { useActionState } from "react";
import { BeforeAfterImage } from "@/components/ui/before-after-image";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
import type { AuthFormState } from "@/features/auth/actions";
import { homeHero, uploadPreview } from "@/lib/placeholders/jewelry-images";

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

export function AuthForm({
  title,
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
    <main className="h-svh overflow-hidden bg-background px-4 py-4 text-right text-foreground sm:py-6">
      <section className="mx-auto flex h-full w-full max-w-sm flex-col justify-center gap-2.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-display text-2xl text-foreground">{title}</h1>
          </div>
          <div className="shrink-0 text-left leading-none" dir="ltr">
            <p className="font-display text-[16px] tracking-[0.15em] text-accent-foreground">OVALA</p>
            <p className="mt-1 text-[7px] tracking-[0.36em] text-accent">STUDIO</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-surface shadow-[var(--shadow-soft)]">
          <BeforeAfterImage
            before={uploadPreview}
            after={homeHero}
            priority
            className="h-36 w-full sm:h-44"
          />

          <form action={formAction} className="space-y-3 px-4 pb-4 pt-1">
            <Field label="ایمیل/موبایل">
              <input
                required
                name="loginIdentifier"
                type="text"
                inputMode="email"
                autoComplete="username"
                dir="ltr"
                className={`${fieldControlClassName} text-left`}
              />
            </Field>

            <Field label="رمز عبور">
              <input
                required
                name="password"
                minLength={6}
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                dir="ltr"
                className={`${fieldControlClassName} text-left`}
              />
            </Field>

            {state.error ? (
              <p className="rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            ) : null}

            <Button type="submit" disabled={pending} size="full" className="mt-1">
              <SubmitIcon aria-hidden="true" className="h-4 w-4" />
              {pending ? "چند لحظه..." : submitLabel}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted">
          {secondaryPrefix}{" "}
          <Link href={secondaryHref} className="inline-flex items-center gap-1 font-medium text-foreground">
            {secondaryLabel}
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </Link>
        </p>
      </section>
    </main>
  );
}
