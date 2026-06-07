"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      dir="rtl"
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[var(--r-lg)] !border !border-border !bg-surface !text-ink-1 !shadow-[var(--shadow-lg)] !text-[13px] !font-semibold",
          description: "!text-ink-3 !text-[12px] !font-normal",
          actionButton: "!bg-ink-1 !text-surface !rounded-[var(--r-pill)]",
        },
      }}
    />
  );
}
