"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-[80] bg-ink-1/40 backdrop-blur-sm",
        "data-[state=open]:animate-[ov-fade-in_var(--d-base)_var(--ease-out)]",
        className,
      )}
      {...props}
    />
  );
});

type DialogContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  size?: "sm" | "md" | "lg";
  showClose?: boolean;
};

export const DialogContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  function DialogContent({ className, children, size = "md", showClose = true, ...props }, ref) {
    const sizeClass = size === "sm" ? "max-w-[20rem]" : size === "lg" ? "max-w-[32rem]" : "max-w-[24rem]";
    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 z-[90] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-[var(--r-2xl)] border border-border bg-surface p-5 shadow-[var(--shadow-xl)]",
            "text-right",
            "data-[state=open]:animate-[ov-fade-in_var(--d-base)_var(--ease-out)]",
            "focus:outline-none",
            sizeClass,
            className,
          )}
          {...props}
        >
          {children}
          {showClose ? (
            <DialogPrimitive.Close
              aria-label="بستن"
              className={cn(
                "ov-press absolute end-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-[var(--r-pill)]",
                "text-ink-3 hover:bg-surface-soft hover:text-ink-1",
              )}
            >
              <X aria-hidden className="h-4 w-4" strokeWidth={2.2} />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);

type DialogHeaderProps = { children: ReactNode; className?: string };
export function DialogHeader({ children, className }: DialogHeaderProps) {
  return <div className={cn("mb-4 space-y-1.5", className)}>{children}</div>;
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-[15px] font-bold text-ink-1", className)}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-[13px] leading-6 text-ink-3", className)}
      {...props}
    />
  );
});

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-5 flex items-center gap-2", className)}>{children}</div>;
}
