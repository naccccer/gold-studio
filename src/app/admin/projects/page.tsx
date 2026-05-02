import { AdminProjectsScreen, type AdminProjectListItem } from "@/features/admin/screens/admin-projects-screen";
import { db } from "@/lib/db";

export default async function AdminProjectsPage() {
  const projects = (await db.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      style: {
        select: { name: true },
      },
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  })) as AdminProjectListItem[];

  return <AdminProjectsScreen projects={projects} />;
}
