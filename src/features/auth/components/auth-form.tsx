"use client";

import Image from "next/image";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
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
  const SubmitIcon = showName ? UserPlus : LogIn;

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-right text-foreground">
      <section className="mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-sm flex-col justify-center gap-4">
        <div className="text-left leading-none" dir="ltr">
          <p className="font-display text-[17px] tracking-[0.16em] text-accent-foreground">OVALA</p>
          <p className="mt-1 text-[8px] tracking-[0.38em] text-accent">STUDIO</p>
        </div>

        <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-surface">
          <div className="relative h-32 w-full">
            <Image src={homeHero.src} alt={homeHero.alt} fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover object-[52%_58%]" priority />
          </div>
          <div className="space-y-1 px-4 py-4">
            <h1 className="text-display text-2xl text-foreground">{title}</h1>
            <p className="text-sm leading-7 text-muted">{description}</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4 rounded-[1.35rem] border border-border/70 bg-surface px-4 py-4">
          {showName ? (
            <Field label="نام">
              <input name="name" type="text" className={fieldControlClassName} />
            </Field>
          ) : null}

          <Field label="ایمیل">
            <input required name="email" type="email" dir="ltr" className={`${fieldControlClassName} text-left`} />
          </Field>

          <Field label="رمز عبور">
            <input required name="password" minLength={8} type="password" dir="ltr" className={`${fieldControlClassName} text-left`} />
          </Field>

          {state.error ? (
            <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} size="full">
            <SubmitIcon aria-hidden="true" className="h-4 w-4" />
            {pending ? "در حال پردازش..." : submitLabel}
          </Button>

          <ButtonLink href={secondaryHref} variant="secondary" size="full">
            {secondaryLabel}
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </ButtonLink>
        </form>
      </section>
    </main>
  );
}
