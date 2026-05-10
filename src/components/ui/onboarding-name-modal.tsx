"use client";

import { Gift, Store, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { completeOnboardingNameAction, type OnboardingNameState } from "@/features/account/actions";

const INITIAL_STATE: OnboardingNameState = {};

export function OnboardingNameModal() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(completeOnboardingNameAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#11100e]/62 px-4 py-5 backdrop-blur-sm sm:items-center">
      <form
        action={formAction}
        className="w-full max-w-[393px] rounded-[1.35rem] border border-white/78 bg-surface p-4 text-right shadow-[0_26px_70px_-36px_rgba(17,16,14,0.75)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-muted">تکمیل حساب</p>
            <h2 className="text-lg font-semibold text-foreground">نام یا نام فروشگاه</h2>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-[#7b5d31]">
            <Store aria-hidden="true" className="h-5 w-5" />
          </span>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">نام نمایشی</span>
          <input
            required
            name="name"
            minLength={2}
            maxLength={80}
            autoComplete="organization"
            className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface-soft px-3 text-sm font-medium text-foreground outline-none focus:border-border-strong"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
            <span>کد معرف</span>
            <Gift aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
          </span>
          <input
            name="referralCode"
            autoComplete="off"
            placeholder="GS..."
            dir="ltr"
            className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface-soft px-3 text-left text-sm font-medium text-foreground outline-none focus:border-border-strong"
          />
        </label>

        {state.error ? <p className="mt-3 rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p> : null}

        <Button type="submit" disabled={pending || state.success} size="full" className="mt-4">
          {pending || state.success ? "در حال ثبت..." : "ثبت"}
          <UserRoundCheck aria-hidden="true" className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
