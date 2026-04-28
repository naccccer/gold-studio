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
        <label className="text-sm font-medium text-muted" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const fieldControlClassName =
  "h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-focus focus:shadow-[var(--shadow-focus)]";
