"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type FieldProps = {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, error, required, trailing, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink-2"
        >
          <span>
            {label}
            {required ? <span className="ms-1 text-champagne-500">*</span> : null}
          </span>
          {trailing}
        </label>
      ) : null}
      {children}
      {error ? (
        <p role="alert" className="text-[12px] font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export const fieldControlClass = cn(
  "w-full rounded-[var(--r-md)] border border-border bg-surface px-4 text-[14px] text-ink-1",
  "h-12 placeholder:text-ink-4",
  "outline-none transition-[border-color,box-shadow,background-color] duration-[var(--d-fast)]",
  "focus:border-champagne-400 focus:[box-shadow:var(--focus-ring)]",
  "disabled:bg-surface-soft disabled:text-ink-3",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:[box-shadow:0_0_0_3px_rgba(154,58,48,0.18)]",
);

export const fieldTextAreaClass = cn(
  fieldControlClass,
  "h-auto min-h-[6rem] py-3 resize-y",
);

// Backward-compat aliases (old name conventions)
export const fieldControlClassName = fieldControlClass;
export const fieldTextAreaClassName = fieldTextAreaClass;

type InputProps = InputHTMLAttributes<HTMLInputElement>;
export const FieldInput = forwardRef<HTMLInputElement, InputProps>(function FieldInput(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(fieldControlClass, className)} {...props} />;
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;
export const FieldTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function FieldTextarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(fieldTextAreaClass, className)} {...props} />;
});
