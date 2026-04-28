"use client";

import { useActionState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
import type { AuthFormState } from "@/features/auth/actions";

type AuthFormProps = {
  title: string;
  description: string;
  action: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  showName?: boolean;
  secondaryHref: string;
  secondaryLabel: string;
};

const INITIAL_STATE: AuthFormState = {};

export function AuthForm({
  title,
  description,
  action,
  submitLabel,
  showName = false,
  secondaryHref,
  secondaryLabel,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ffffff_42%,_#f8fafc_100%)] px-4 py-6 text-right text-slate-900">
      <section className="mx-auto w-full max-w-md rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-xs font-semibold tracking-[0.24em] text-amber-700">GOLD STUDIO</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>

        <form action={formAction} className="mt-6 space-y-4">
          {showName ? (
            <Field label="نام اختیاری">
              <input name="name" type="text" className={fieldControlClassName} />
            </Field>
          ) : null}

          <Field label="ایمیل">
            <input
              required
              name="email"
              type="email"
              dir="ltr"
              className={`${fieldControlClassName} text-left`}
            />
          </Field>

          <Field label="رمز عبور">
            <input
              required
              name="password"
              minLength={8}
              type="password"
              dir="ltr"
              className={`${fieldControlClassName} text-left`}
            />
          </Field>

          {state.error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} size="full">
            {pending ? "در حال پردازش..." : submitLabel}
          </Button>
        </form>

        <ButtonLink href={secondaryHref} variant="secondary" size="full" className="mt-3">
          {secondaryLabel}
        </ButtonLink>
      </section>
    </main>
  );
}
