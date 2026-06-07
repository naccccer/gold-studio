"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type SheetProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;

export function Sheet(props: SheetProps) {
  return <DialogPrimitive.Root {...props} />;
}

export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function SheetOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-[80] bg-ink-1/40 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
});

type SheetContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  height?: "sm" | "md" | "lg" | "auto";
};

export const SheetContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(
  function SheetContent({ className, children, height = "md", ...props }, ref) {
    const heightClass =
      height === "sm" ? "max-h-[40dvh]" : height === "lg" ? "max-h-[85dvh]" : height === "auto" ? "" : "max-h-[65dvh]";
    return (
      <SheetPortal>
        <SheetOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed inset-x-0 bottom-0 z-[90] w-full",
            "rounded-t-[var(--r-2xl)] border-t border-border bg-surface",
            "shadow-[var(--shadow-xl)]",
            "text-right",
            "focus:outline-none",
            "data-[state=open]:animate-[ov-fade-in_var(--d-slow)_var(--ease-out)]",
            heightClass,
            className,
          )}
          {...props}
        >
          <span
            aria-hidden
            className="mx-auto mt-2 block h-1 w-10 rounded-[var(--r-pill)] bg-border"
          />
          {children}
        </DialogPrimitive.Content>
      </SheetPortal>
    );
  },
);

type SheetHeaderProps = { children: ReactNode; className?: string };
export function SheetHeader({ children, className }: SheetHeaderProps) {
  return <div className={cn("px-5 pt-4 pb-3", className)}>{children}</div>;
}

export function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto", className)}>{children}</div>;
}
