"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
import type { AuthFormState } from "@/features/auth/actions";
import { homeHero } from "@/lib/placeholders/jewelry-images";

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
    <main className="min-h-screen bg-background px-4 py-6 text-right text-foreground">
      <section className="mx-auto w-full max-w-sm space-y-4">
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-surface-soft/80">
          <div className="relative h-32 w-full">
            <Image src={homeHero.src} alt={homeHero.alt} fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover" priority />
          </div>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-border/70 bg-surface p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs text-muted">Gold Studio</p>
          <h1 className="mt-2 text-display text-2xl text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted">{description}</p>

          <form action={formAction} className="mt-5 space-y-4">
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
            <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
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
        </div>
      </section>
    </main>
  );
}
