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
        <label className="text-sm text-slate-700" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export const fieldControlClassName =
  "h-11 w-full rounded-xl border border-slate-200 px-3 outline-none ring-amber-200 transition focus:ring";
