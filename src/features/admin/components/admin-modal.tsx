"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { XCircle } from "lucide-react";

type AdminModalProps = {
  title: string;
  trigger: ReactNode;
  children: ReactNode;
};

export function AdminModal({ title, trigger, children }: AdminModalProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

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
      <button type="button" onClick={() => setOpen(true)} className="contents">
        {trigger}
      </button>
      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-black/46 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:items-center sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              dir="rtl"
              onClick={() => setOpen(false)}
            >
              <div
                className="w-full max-w-4xl overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface text-right shadow-[0_28px_70px_-38px_rgba(0,0,0,0.72)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <h2 id={titleId} className="text-sm font-semibold text-foreground">
                    {title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="بستن"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-soft text-muted transition hover:text-foreground"
                  >
                    <XCircle className="h-4 w-4" aria-hidden={true} />
                  </button>
                </div>
                <div className="max-h-[min(78svh,720px)] overflow-y-auto p-4">{children}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
