import { AdminHomeScreen, type AdminUserListItem } from "@/features/admin/screens/admin-home-screen";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminPage() {
  await requireAdminSession();

  const [users, projectsCount, completedCount] = (await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
      },
    }),
    db.project.count(),
    db.project.count({ where: { status: "COMPLETED" } }),
  ])) as [AdminUserListItem[], number, number];

  return <AdminHomeScreen users={users} projectsCount={projectsCount} completedCount={completedCount} />;
}
