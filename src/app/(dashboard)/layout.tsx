import { DashboardFrame } from "@/components/ui/dashboard-frame";
import type { ReactNode } from "react";
import { requireUserSession } from "@/lib/auth/session";
import { getUserDisplayName } from "@/lib/auth/user-identity";
import { getUserCreditSummary } from "@/lib/billing";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { getUserNotificationSummary } from "@/lib/notifications";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const [user, creditSummary, notificationSummary] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, phone: true, startGuideSeenAt: true },
    }),
    getUserCreditSummary(session.userId, vertical),
    getUserNotificationSummary(session.userId),
  ]);

  const quietName = user ? getUserDisplayName(user) : "حساب کاربری";
  const needsNameOnboarding = !user?.name?.trim();
  const showStartGuide = !needsNameOnboarding && !user?.startGuideSeenAt;

  return (
    <DashboardFrame
      userLabel={quietName}
      remainingCredits={creditSummary.totalAvailableCredits}
      unreadNotificationCount={notificationSummary.unreadCount}
      recentNotifications={notificationSummary.recent.map((notification) => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString() ?? null,
      }))}
      needsNameOnboarding={needsNameOnboarding}
      showStartGuide={showStartGuide}
      vertical={vertical}
    >
      {children}
    </DashboardFrame>
  );
}
