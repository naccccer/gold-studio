"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardMasthead } from "@/components/ui/dashboard-masthead";

type DashboardFrameProps = {
  children: ReactNode;
  userLabel: string;
};

export function DashboardFrame({ children, userLabel }: DashboardFrameProps) {
  const pathname = usePathname();
  const isProjectDetail = /^\/projects\/[^/]+$/.test(pathname);

  return (
    <div
      className={
        isProjectDetail
          ? "min-h-screen bg-[#0d0c0a] px-4 pb-24 pt-4 text-right text-foreground sm:px-5"
          : "min-h-screen bg-background px-4 pb-24 pt-4 text-right text-foreground sm:px-6 sm:pt-5"
      }
    >
      <div className="mx-auto w-full max-w-[393px] md:max-w-5xl">
        <DashboardMasthead userLabel={userLabel} />
        {children}
      </div>
    </div>
  );
}
