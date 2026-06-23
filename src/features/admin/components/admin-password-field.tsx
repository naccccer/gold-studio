"use client";

import { useId, useState } from "react";
import { Eye, EyeSlash } from "vuesax-icons-react";
import { fieldClass } from "@/features/admin/components/console";

type AdminPasswordFieldProps = {
  label: string;
  name: string;
  autoComplete?: string;
};

export function AdminPasswordField({ label, name, autoComplete = "new-password" }: AdminPasswordFieldProps) {
  const inputId = useId();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="grid min-w-0 content-start gap-1.5 text-xs font-medium text-slate-600">
      <label htmlFor={inputId}>{label}</label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          required
          minLength={6}
          type={isVisible ? "text" : "password"}
          dir="ltr"
          autoComplete={autoComplete}
          className={`${fieldClass} pl-11 text-left`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          aria-label={isVisible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          className="absolute left-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600"
        >
          {isVisible ? (
            <EyeSlash aria-hidden="true" size={17} color="currentColor" variant="Linear" />
          ) : (
            <Eye aria-hidden="true" size={17} color="currentColor" variant="Linear" />
          )}
        </button>
      </div>
    </div>
  );
}
