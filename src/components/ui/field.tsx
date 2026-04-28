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
    <div className={["space-y-2.5", className].filter(Boolean).join(" ")}>
      {label ? (
        <label className="text-sm font-semibold tracking-[-0.005em] text-foreground-soft" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className="quiet-meta">{hint}</p> : null}
      {error ? (
        <p className="rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm text-danger ring-1 ring-danger/25">{error}</p>
      ) : null}
    </div>
  );
}

export const fieldControlClassName =
  "h-11 w-full rounded-[var(--radius-md)] bg-surface px-3 text-foreground ring-1 ring-inset ring-border outline-none transition placeholder:text-muted-foreground focus-visible:ring-border-strong focus-visible:shadow-[var(--shadow-focus)]";
