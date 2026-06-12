"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Danger, Trash } from "vuesax-icons-react";
import { Button } from "@/components/ui/button";

type ConfirmActionField = {
  name: string;
  value: string;
};

type ConfirmActionProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields: ConfirmActionField[];
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  trigger?: (open: () => void) => ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerIcon?: "trash";
};

export function ConfirmAction({
  action,
  fields,
  title,
  description,
  confirmLabel = "تایید حذف",
  cancelLabel = "انصراف",
  trigger,
  triggerLabel = confirmLabel,
  triggerClassName,
  triggerIcon,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const dialog = open
    ? createPortal(
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-black/58 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          dir="rtl"
          onClick={() => setOpen(false)}
        >
          <div
            className="motion-reveal-soft w-full max-w-[24rem] overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#17130f] text-right text-surface shadow-[0_28px_70px_-34px_rgba(0,0,0,0.95)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-4 px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-danger/35 bg-danger/14 text-[#ffb5aa]">
                  <Danger aria-hidden={true} className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <h2 id={titleId} className="text-sm font-bold leading-7 !text-white">
                    {title}
                  </h2>
                  {description ? (
                    <p id={descriptionId} className="mx-auto mt-1 max-w-[18rem] text-xs leading-6 text-white/68">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>
              <form action={action} className="grid grid-cols-2 gap-2 pt-1">
                {fields.map((field, index) => (
                  <input key={`${field.name}-${field.value}-${index}`} type="hidden" name={field.name} value={field.value} />
                ))}
                <Button
                  type="button"
                  variant="studio-secondary"
                  onClick={() => setOpen(false)}
                  className="h-12 min-w-0 rounded-[1rem] border border-white/10 px-3 text-sm leading-5"
                >
                  {cancelLabel}
                </Button>
                <Button type="submit" variant="danger" className="h-12 min-w-0 rounded-[1rem] px-3 text-sm leading-5">
                  <Trash aria-hidden={true} className="h-4 w-4" />
                  {confirmLabel}
                </Button>
              </form>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
          {triggerIcon === "trash" ? <Trash className="h-4 w-4" /> : null}
          {triggerLabel}
        </button>
      )}
      {dialog}
    </>
  );
}
