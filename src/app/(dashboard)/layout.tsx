import { DashboardFrame } from "@/components/ui/dashboard-frame";
import type { ReactNode } from "react";
import { requireUserSession } from "@/lib/auth/session";
import { getUserDisplayName } from "@/lib/auth/user-identity";
import { getUserCreditSummary } from "@/lib/billing";
import { db } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireUserSession();
  const [user, creditSummary] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, phone: true },
    }),
    getUserCreditSummary(session.userId),
  ]);

  const quietName = user ? getUserDisplayName(user) : "حساب کاربری";
  const needsNameOnboarding = !user?.name?.trim();

  return (
    <DashboardFrame
      userLabel={quietName}
      remainingCredits={creditSummary.totalAvailableCredits}
      needsNameOnboarding={needsNameOnboarding}
    >
      {children}
    </DashboardFrame>
  );
}
