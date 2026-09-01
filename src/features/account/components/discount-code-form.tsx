"use client";

import { useActionState } from "react";
import { DiscountShape, Trash } from "vuesax-icons-react";
import { buttonClasses } from "@/components/ui/button";
import { fieldControlClassName } from "@/components/ui/field";
import { applyDiscountCodeAction, removeDiscountCodeAction } from "@/features/account/actions";
import { INITIAL_DISCOUNT_ACTION_STATE } from "@/lib/discounts";

export function DiscountCodeForm({
  requestId,
  appliedCode,
  locked,
}: {
  requestId: string;
  appliedCode: string | null;
  locked: boolean;
}) {
  const [applyState, applyAction, applyPending] = useActionState(applyDiscountCodeAction, INITIAL_DISCOUNT_ACTION_STATE);
  const [removeState, removeAction, removePending] = useActionState(removeDiscountCodeAction, INITIAL_DISCOUNT_ACTION_STATE);
  const state = removeState.status !== "idle" ? removeState : applyState;

  if (locked) {
    return appliedCode ? (
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-white/62 px-3 py-2.5 text-xs">
        <span className="text-muted">کد تخفیف</span>
        <span className="font-semibold tracking-wide text-foreground" dir="ltr">{appliedCode}</span>
      </div>
    ) : null;
  }

  return (
    <div className="space-y-2.5">
      <form action={applyAction} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <label className="sr-only" htmlFor={`discount-code-${requestId}`}>کد تخفیف</label>
        <input
          id={`discount-code-${requestId}`}
          name="code"
          defaultValue={appliedCode ?? ""}
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          maxLength={32}
          placeholder="OVALA20"
          className={`${fieldControlClassName} text-left uppercase tracking-[0.08em]`}
        />
        <button
          type="submit"
          disabled={applyPending || removePending}
          className={buttonClasses({ variant: "secondary", className: "h-11 px-3 text-xs disabled:cursor-wait disabled:opacity-60" })}
        >
          <DiscountShape aria-hidden={true} className="h-4 w-4" />
          {applyPending ? "در حال بررسی" : appliedCode ? "اعمال دوباره" : "اعمال کد"}
        </button>
      </form>

      {appliedCode ? (
        <form action={removeAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <button
            type="submit"
            disabled={applyPending || removePending}
            className="motion-press inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
          >
            <Trash aria-hidden={true} className="h-3.5 w-3.5" />
            {removePending ? "در حال حذف" : "حذف کد تخفیف"}
          </button>
        </form>
      ) : null}

      {state.status !== "idle" ? (
        <p
          role="status"
          className={[
            "rounded-[var(--radius-md)] px-3 py-2 text-xs leading-6",
            state.status === "error" ? "bg-danger-soft text-danger" : "bg-[#e3efe8] text-[#28613f]",
          ].join(" ")}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
