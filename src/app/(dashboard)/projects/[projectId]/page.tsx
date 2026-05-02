import { notFound } from "next/navigation";
import { ProjectDetailScreen, type ProjectDetail } from "@/features/projects/screens/project-detail-screen";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireUserSession();
  const { projectId } = await params;

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId: session.userId,
    },
    include: {
      style: {
        select: { name: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return <ProjectDetailScreen project={project as ProjectDetail} />;
}
