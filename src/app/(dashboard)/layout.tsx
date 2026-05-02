import { DashboardFrame } from "@/components/ui/dashboard-frame";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireUserSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true },
  });

  const quietName = user?.name || user?.email || "حساب کاربری";

  return (
    <DashboardFrame userLabel={quietName} isAdmin={session.role === "ADMIN"}>
      {children}
    </DashboardFrame>
  );
}
