import { notFound } from "next/navigation";
import { after } from "next/server";
import { ProjectDetailScreen, type ProjectDetail } from "@/features/projects/screens/project-detail-screen";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { getEffectiveFreeVariantLimit } from "@/lib/billing";
import { getCurrentVertical } from "@/lib/current-vertical";
import { isRawImageFilenameTitle, retryProjectVisionTitle } from "@/lib/product-vision";
import { readStorageObject, storagePublicUrl } from "@/lib/storage";
import { getVerticalContent } from "@/lib/vertical-content";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const content = getVerticalContent(vertical);
  const { projectId } = await params;

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId: session.userId,
      vertical,
      archivedAt: null,
    },
    include: {
      style: {
        select: { name: true },
      },
      sourceAsset: {
        select: { storageKey: true, productType: true, visionShortTitle: true },
      },
      qualityReviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  let resultImageError: string | null = null;
  const resultImageUrl = project.resultStorageKey ? storagePublicUrl(project.resultStorageKey) : project.resultImageUrl;
  const visionTitle = project.sourceAsset?.visionShortTitle?.trim() || null;
  let title = project.title;

  if (isRawImageFilenameTitle(title) && visionTitle) {
    title = visionTitle;
    await db.project.updateMany({
      where: { id: project.id, userId: session.userId, vertical, archivedAt: null },
      data: { title: visionTitle },
    });
  }

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

  const titleRefreshPending = Boolean(project.sourceAssetId && isRawImageFilenameTitle(title));

  if (titleRefreshPending) {
    after(() => retryProjectVisionTitle(project.id, session.userId));
  }

  let variantNumber: number | null = null;
  let freeVariantRemaining: number | null = null;
  if (project.sourceAssetId) {
    const [sourceProjects, usedFreeVariantCount, freeVariantLimit] = await Promise.all([
      db.project.findMany({
        where: { userId: session.userId, vertical, sourceAssetId: project.sourceAssetId, archivedAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true },
      }),
      project.variantParentId
        ? Promise.resolve(0)
        : db.project.count({
            where: {
              userId: session.userId,
              vertical,
              variantParentId: project.id,
              archivedAt: null,
              status: "COMPLETED",
            },
          }),
      getEffectiveFreeVariantLimit(session.userId),
    ]);
    const variantIndex = sourceProjects.findIndex((item) => item.id === project.id);
    variantNumber = variantIndex >= 0 ? variantIndex + 1 : null;
    freeVariantRemaining = Math.max(0, freeVariantLimit - usedFreeVariantCount);
  }

  return (
    <ProjectDetailScreen
      content={content}
      project={
        {
          ...project,
          title,
          sourceImageUrl: project.sourceAsset?.storageKey
            ? storagePublicUrl(project.sourceAsset.storageKey)
            : project.sourceImageUrl,
          resultImageUrl,
          resultImageError,
          productType: project.sourceAsset?.productType ?? null,
          titleRefreshPending,
          variantNumber,
          freeVariantRemaining,
          qualityReviewStatus: project.qualityReviews[0]?.status ?? null,
        } as ProjectDetail
      }
    />
  );
}
