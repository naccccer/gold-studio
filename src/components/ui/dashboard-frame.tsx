"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardMasthead } from "@/components/ui/dashboard-masthead";
import { OnboardingNameModal } from "@/components/ui/onboarding-name-modal";

type DashboardFrameProps = {
  children: ReactNode;
  userLabel: string;
  remainingCredits: number;
  needsNameOnboarding: boolean;
};

export function DashboardFrame({
  children,
  userLabel,
  remainingCredits,
  needsNameOnboarding,
}: DashboardFrameProps) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";
  const isProjectDarkSurface =
    pathname === "/projects/new" ||
    pathname.startsWith("/gallery/batches/") ||
    /^\/projects\/[^/]+$/.test(pathname);

  return (
    <div
      data-tone={isProjectDarkSurface ? "studio" : "warm"}
      className="min-h-[100dvh] bg-bg text-ink-1"
    >
      <div
        data-ovala-phone-frame
        className="relative mx-auto flex min-h-[100dvh] w-full max-w-[420px] flex-col"
      >
        <DashboardMasthead
          userLabel={userLabel}
          remainingCredits={remainingCredits}
        />
        <main
          className={
            isProjectDarkSurface
              ? "flex min-h-0 flex-1 flex-col"
              : "flex-1 pb-[calc(7rem+env(safe-area-inset-bottom))]"
          }
        >
          {children}
        </main>
        <span className="sr-only">{userLabel}</span>
        {needsNameOnboarding ? <OnboardingNameModal /> : null}
      </div>
    </div>
  );
}
