"use client";

import { useId, useState } from "react";
import { Eye, EyeSlash } from "vuesax-icons-react";
import { accountInputClass } from "@/features/account/components/account-subpage";

type AccountPasswordInputProps = {
  label: string;
  name: string;
  autoComplete: string;
};

export function AccountPasswordInput({ label, name, autoComplete }: AccountPasswordInputProps) {
  const inputId = useId();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="block space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={isVisible ? "text" : "password"}
          minLength={6}
          required
          dir="ltr"
          autoComplete={autoComplete}
          className={`${accountInputClass} pl-11 text-left`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          aria-label={isVisible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
