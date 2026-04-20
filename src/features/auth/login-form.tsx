"use client";

import { useActionState } from "react";
import { loginWithCredentials } from "@/features/auth/actions";

const initialState: string | undefined = undefined;

export function LoginForm() {
  const [error, formAction, isPending] = useActionState(loginWithCredentials, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          ایمیل
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 w-full rounded-2xl border border-slate-300 px-3 text-sm outline-none ring-amber-200 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2"
          placeholder="name@example.com"
          dir="ltr"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          رمز عبور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 w-full rounded-2xl border border-slate-300 px-3 text-sm outline-none ring-amber-200 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2"
          placeholder="********"
          dir="ltr"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "در حال ورود..." : "ورود"}
      </button>
    </form>
  );
}
