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
  const frameTone = isProjectDarkSurface ? "studio" : "normal";

  return (
    <div
      className={
        frameTone === "studio"
          ? "min-h-screen bg-[#0d0c0a] px-4 pb-5 pt-4 text-right text-foreground md:bg-[radial-gradient(circle_at_top,#201a12_0%,#0d0c0a_44%,#070604_100%)] md:py-6"
          : "min-h-screen bg-background px-4 pb-24 pt-4 text-right text-foreground md:bg-[radial-gradient(circle_at_top,#fffaf0_0%,#f6f1e8_42%,#e8dece_100%)] md:py-6"
      }
    >
      <div
        className={
          frameTone === "studio"
            ? "mx-auto min-h-[calc(100svh-2rem)] w-full max-w-[393px] bg-[#0d0c0a] md:min-h-[calc(100svh-3rem)] md:overflow-hidden md:rounded-[2rem] md:border md:border-white/10 md:shadow-[0_38px_100px_-64px_rgba(0,0,0,1)]"
            : "mx-auto min-h-[calc(100svh-2rem)] w-full max-w-[393px] bg-background md:min-h-[calc(100svh-3rem)] md:overflow-hidden md:rounded-[2rem] md:border md:border-white/80 md:shadow-[0_30px_80px_-52px_rgba(23,20,17,0.65)]"
        }
      >
        <DashboardMasthead userLabel={userLabel} remainingCredits={remainingCredits} />
        {children}
      </div>
      {needsNameOnboarding ? <OnboardingNameModal /> : null}
    </div>
  );
}
