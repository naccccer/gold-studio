"use client";

import { ChevronDown, Store, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeOnboardingNameAction, type OnboardingNameState } from "@/features/account/actions";

const INITIAL_STATE: OnboardingNameState = {};

export function OnboardingNameModal() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(completeOnboardingNameAction, INITIAL_STATE);
  const [showReferralCode, setShowReferralCode] = useState(false);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#11100e]/62 px-4 py-[calc(env(safe-area-inset-bottom)+1.25rem)] backdrop-blur-sm">
      <form
        action={formAction}
        className="w-full max-w-[393px] rounded-[1.35rem] border border-white/78 bg-surface p-4 text-right shadow-[0_26px_70px_-36px_rgba(17,16,14,0.75)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="pt-1 text-lg font-semibold text-foreground">نام شما/فروشگاه</h2>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-[#7b5d31]">
            <Store aria-hidden="true" className="h-5 w-5" />
          </span>
        </div>

        <label className="block">
          <input
            required
            name="name"
            minLength={2}
            maxLength={80}
            autoComplete="organization"
            className="h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface-soft px-3 text-sm font-medium text-foreground outline-none focus:border-border-strong"
          />
        </label>

        <div className="mt-2">
          <button
            type="button"
            aria-expanded={showReferralCode}
            onClick={() => setShowReferralCode((value) => !value)}
            className="inline-flex items-center gap-1.5 px-1 py-1 text-[11px] font-medium text-muted transition hover:text-foreground"
          >
            اگر کد معرف یا هدیه دارید
            <ChevronDown
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition ${showReferralCode ? "rotate-180" : ""}`}
              strokeWidth={1.8}
            />
          </button>

          {showReferralCode ? (
            <input
              name="referralCode"
              autoComplete="off"
              placeholder="12345678"
              dir="ltr"
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface-soft px-3 text-left text-sm font-medium text-foreground outline-none focus:border-border-strong"
            />
          ) : null}
        </div>

        {state.error ? <p className="mt-3 rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p> : null}

        <Button type="submit" disabled={pending || state.success} size="full" className="mt-4">
          {pending || state.success ? "در حال ثبت..." : "ثبت"}
          <UserRoundCheck aria-hidden="true" className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
