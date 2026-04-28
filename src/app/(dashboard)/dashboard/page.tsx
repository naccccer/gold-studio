import { DashboardHomeScreen } from "@/features/dashboard/screens/dashboard-home-screen";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireUserSession();

  const [user, projectCount, completedCount] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId } }),
    db.project.count({ where: { userId: session.userId } }),
    db.project.count({ where: { userId: session.userId, status: "COMPLETED" } }),
  ]);

  return (
    <DashboardHomeScreen
      userName={user?.name}
      projectCount={projectCount}
      completedCount={completedCount}
    />
  );
}
