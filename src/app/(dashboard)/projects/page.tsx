import { ProjectsListScreen, type ProjectListItem } from "@/features/projects/screens/projects-list-screen";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";

export default async function ProjectsPage() {
  const session = await requireUserSession();

  const projects = (await db.project.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  })) as ProjectListItem[];

  return <ProjectsListScreen projects={projects} />;
}
