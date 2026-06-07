"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { ChevronDown, Store, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldInput } from "@/components/ui/field";
import { completeOnboardingNameAction, type OnboardingNameState } from "@/features/account/actions";

const INITIAL: OnboardingNameState = {};

export function OnboardingNameModal() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(completeOnboardingNameAction, INITIAL);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  return (
    <Dialog open>
      <DialogContent size="md">
        <DialogHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-[var(--r-pill)] bg-champagne-50 text-champagne-600">
            <Store aria-hidden className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <DialogTitle>نام شما یا فروشگاه</DialogTitle>
          <DialogDescription>
            برای شروع، نامی که می‌خواهید در استودیو ببینید را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-3">
          <Field htmlFor="onboarding-name" required>
            <FieldInput
              id="onboarding-name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              autoComplete="organization"
              aria-invalid={state.error ? true : undefined}
            />
          </Field>

          <button
            type="button"
            aria-expanded={showReferral}
            onClick={() => setShowReferral((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-3 hover:text-ink-1"
          >
            کد معرف یا تست دارم
            <ChevronDown
              aria-hidden
              className={`h-3.5 w-3.5 transition-transform ${showReferral ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>

          {showReferral ? (
            <Field htmlFor="onboarding-referral">
              <FieldInput
                id="onboarding-referral"
                name="referralCode"
                placeholder="12345678"
                dir="ltr"
                inputMode="numeric"
                maxLength={16}
                className="text-left"
              />
            </Field>
          ) : null}

          {state.error ? (
            <p role="alert" className="text-[12px] font-medium text-danger">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending || state.success} variant="champagne" size="lg" fullWidth>
              {pending || state.success ? "در حال ثبت..." : "ثبت و ادامه"}
              <UserCheck aria-hidden className="h-4 w-4" strokeWidth={2.2} />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
