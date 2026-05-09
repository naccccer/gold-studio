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

export function DashboardFrame({ children, userLabel, remainingCredits, needsNameOnboarding }: DashboardFrameProps) {
  const pathname = usePathname();
  const isProjectDarkSurface = pathname === "/projects/new" || /^\/projects\/[^/]+$/.test(pathname);

  return (
    <div
      className={
        isProjectDarkSurface
          ? "min-h-screen bg-[#0d0c0a] px-4 pb-24 pt-4 text-right text-foreground sm:px-5"
          : "min-h-screen bg-background px-4 pb-24 pt-4 text-right text-foreground sm:px-6 sm:pt-5"
      }
    >
      <div className="mx-auto w-full max-w-[393px] md:max-w-5xl">
        <DashboardMasthead userLabel={userLabel} remainingCredits={remainingCredits} />
        {children}
      </div>
      {needsNameOnboarding ? <OnboardingNameModal /> : null}
    </div>
  );
}
