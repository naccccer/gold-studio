import { notFound } from "next/navigation";
import { ProjectDetailScreen, type ProjectDetail } from "@/features/projects/screens/project-detail-screen";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { readStorageObject, storagePublicUrl } from "@/lib/storage";

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

  let resultImageError: string | null = null;
  const resultImageUrl = project.resultStorageKey ? storagePublicUrl(project.resultStorageKey) : project.resultImageUrl;

  if (project.status === "COMPLETED" && project.resultStorageKey) {
    try {
      await readStorageObject(project.resultStorageKey, "application/octet-stream");
    } catch (error) {
      resultImageError =
        `فایل خروجی ذخیره‌شده پیدا نشد یا قابل خواندن نیست. کلید ذخیره‌سازی: ${project.resultStorageKey}`;
      console.error("[project-result-missing]", {
        projectId: project.id,
        resultStorageKey: project.resultStorageKey,
        error,
      });
    }
  }

  return (
    <ProjectDetailScreen
      project={
        {
          ...project,
          sourceImageUrl: project.sourceAsset?.storageKey
            ? storagePublicUrl(project.sourceAsset.storageKey)
            : project.sourceImageUrl,
          resultImageUrl,
          resultImageError,
          productType: project.sourceAsset?.productType ?? null,
        } as ProjectDetail
      }
    />
  );
}
