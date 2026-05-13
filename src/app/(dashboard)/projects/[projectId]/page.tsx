import { notFound } from "next/navigation";
import { ProjectDetailScreen, type ProjectDetail } from "@/features/projects/screens/project-detail-screen";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { storagePublicUrl } from "@/lib/storage";

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
      archivedAt: null,
    },
    include: {
      style: {
        select: { name: true },
      },
      sourceAsset: {
        select: { storageKey: true, productType: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetailScreen
      project={
        {
          ...project,
          sourceImageUrl: project.sourceAsset?.storageKey
            ? storagePublicUrl(project.sourceAsset.storageKey)
            : project.sourceImageUrl,
          resultImageUrl: project.resultStorageKey ? storagePublicUrl(project.resultStorageKey) : project.resultImageUrl,
          productType: project.sourceAsset?.productType ?? null,
        } as ProjectDetail
      }
    />
  );
}
