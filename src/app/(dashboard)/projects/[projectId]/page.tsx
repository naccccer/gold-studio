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
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#0b0a08] px-4 pt-4 pb-24 sm:-mx-6 sm:-mt-5 sm:px-6 sm:pt-5">
      <ProjectDetailScreen project={project as ProjectDetail} />
    </div>
  );
}
