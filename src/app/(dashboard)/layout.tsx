import { DashboardFrame } from "@/components/ui/dashboard-frame";
import type { ReactNode } from "react";
import { requireUserSession } from "@/lib/auth/session";
import { getUserDisplayName } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireUserSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, phone: true },
  });

  const quietName = user ? getUserDisplayName(user) : "حساب کاربری";

  return <DashboardFrame userLabel={quietName}>{children}</DashboardFrame>;
}
