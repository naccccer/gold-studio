import { DashboardHomeScreen } from "@/features/dashboard/screens/dashboard-home-screen";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireUserSession();

  const [user, projectCount, completedCount, recentProjects] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId } }),
    db.project.count({ where: { userId: session.userId, archivedAt: null } }),
    db.project.count({ where: { userId: session.userId, status: "COMPLETED", archivedAt: null } }),
    db.project.findMany({
      where: { userId: session.userId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        style: {
          select: { name: true },
        },
        sourceImageUrl: true,
        resultImageUrl: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <DashboardHomeScreen
      userName={user?.name}
      projectCount={projectCount}
      completedCount={completedCount}
      recentProjects={recentProjects}
    />
  );
}
