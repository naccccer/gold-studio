"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { CloseCircle, Danger, Trash } from "vuesax-icons-react";
import { Button } from "@/components/ui/button";

type ConfirmActionField = {
  name: string;
  value: string;
};

type ConfirmActionProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields: ConfirmActionField[];
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  trigger: (open: () => void) => ReactNode;
};

export function ConfirmAction({
  action,
  fields,
  title,
  description,
  confirmLabel = "تایید حذف",
  cancelLabel = "انصراف",
  trigger,
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

  return (
    <>
      {trigger(() => setOpen(true))}
      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/58 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-6 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          dir="rtl"
          onClick={() => setOpen(false)}
        >
          <div
            className="motion-reveal-soft w-full max-w-[22.5rem] overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#17130f] text-right text-surface shadow-[0_28px_70px_-34px_rgba(0,0,0,0.95)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-3 px-4 pb-4 pt-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-danger/35 bg-danger/14 text-[#ffb5aa]">
                  <Danger aria-hidden={true} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="text-sm font-semibold leading-7 text-white">
                    {title}
                  </h2>
                  <p id={descriptionId} className="mt-1 text-xs leading-6 text-white/68">
                    {description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="بستن"
                  className="motion-press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/72"
                >
                  <CloseCircle aria-hidden={true} className="h-4.5 w-4.5" />
                </button>
              </div>
              <form action={action} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 pt-1">
                {fields.map((field, index) => (
                  <input key={`${field.name}-${field.value}-${index}`} type="hidden" name={field.name} value={field.value} />
                ))}
                <Button
                  type="button"
                  variant="studio-secondary"
                  onClick={() => setOpen(false)}
                  className="h-12 rounded-[1rem] border border-white/10 text-sm"
                >
                  {cancelLabel}
                </Button>
                <Button type="submit" variant="danger" className="h-12 rounded-[1rem] px-4 text-sm">
                  <Trash aria-hidden={true} className="h-4 w-4" />
                  {confirmLabel}
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
