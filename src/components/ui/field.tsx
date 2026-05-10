import type { ReactNode } from "react";

type FieldProps = {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, hint, error, children, className = "" }: FieldProps) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      {label ? (
        <label className="block text-sm font-semibold text-muted-strong" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className="text-xs leading-6 text-muted">{hint}</p> : null}
      {error ? (
        <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const fieldControlClassName =
  "min-h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground disabled:bg-surface-soft disabled:text-muted disabled:opacity-70 focus:border-focus focus:shadow-[var(--shadow-focus)]";

export const fieldTextAreaClassName =
  "min-h-24 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground disabled:bg-surface-soft disabled:text-muted disabled:opacity-70 focus:border-focus focus:shadow-[var(--shadow-focus)]";
