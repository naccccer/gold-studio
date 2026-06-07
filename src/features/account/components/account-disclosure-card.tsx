"use client";

import { useState, type ReactNode } from "react";
import { ChevronsDown, Lock, User, UserRound } from "lucide-react";
import { accountCardClass } from "@/features/account/components/account-subpage";

type AccountDisclosureCardProps = {
  title: string;
  icon: "profile" | "lock";
  children: ReactNode;
};

const icons = {
  profile: UserRound,
  lock: Lock,
};

export function AccountDisclosureCard({ title, icon, children }: AccountDisclosureCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = icons[icon];

  return (
    <section className={accountCardClass}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 text-right"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
            <Icon aria-hidden={true} className="h-4.5 w-4.5" />
          </span>
          <span className="truncate text-sm font-semibold text-foreground">{title}</span>
        </span>
        <ChevronsDown
          aria-hidden={true}
          className={`h-4 w-4 shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? <div className="mt-3 space-y-3">{children}</div> : null}
    </section>
  );
}
