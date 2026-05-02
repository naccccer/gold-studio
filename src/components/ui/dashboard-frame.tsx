"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardMasthead } from "@/components/ui/dashboard-masthead";

type DashboardFrameProps = {
  children: ReactNode;
  isAdmin: boolean;
  userLabel: string;
};

const projectDetailRoutePattern = /^\/projects\/[^/]+$/;

export function DashboardFrame({ children, isAdmin, userLabel }: DashboardFrameProps) {
  const pathname = usePathname();
  const isProjectDetailRoute = projectDetailRoutePattern.test(pathname);

  return (
    <div
      className={
        isProjectDetailRoute
          ? "min-h-screen bg-[#0b0a08] px-0 pb-24 pt-0 text-right text-foreground"
          : "min-h-screen bg-background px-4 pb-24 pt-4 text-right text-foreground sm:px-6 sm:pt-5"
      }
    >
      <div className={isProjectDetailRoute ? "mx-auto w-full max-w-5xl" : "mx-auto w-full max-w-5xl"}>
        <DashboardMasthead userLabel={userLabel} isAdmin={isAdmin} />
        {children}
      </div>
    </div>
  );
}
