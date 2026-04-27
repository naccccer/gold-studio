"use client";

import { useActionState } from "react";
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
            <label className="block space-y-2 text-sm">
              <span className="text-slate-700">نام (اختیاری)</span>
              <input
                name="name"
                type="text"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-amber-200 transition focus:ring"
              />
            </label>
          ) : null}

          <label className="block space-y-2 text-sm">
            <span className="text-slate-700">ایمیل</span>
            <input
              required
              name="email"
              type="email"
              dir="ltr"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-left outline-none ring-amber-200 transition focus:ring"
            />
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-700">رمز عبور</span>
            <input
              required
              name="password"
              minLength={8}
              type="password"
              dir="ltr"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-left outline-none ring-amber-200 transition focus:ring"
            />
          </label>

          {state.error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "در حال پردازش..." : submitLabel}
          </button>
        </form>

        <a
          href={secondaryHref}
          className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {secondaryLabel}
        </a>
      </section>
    </main>
  );
}
