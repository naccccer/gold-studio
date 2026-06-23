import { DashboardHomeScreen } from "@/features/dashboard/screens/dashboard-home-screen";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { getActiveHomeCarouselImages } from "@/lib/home-carousel";
import { storagePublicUrl } from "@/lib/storage";

export default async function DashboardPage() {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();

  const [user, projectCount, completedCount, recentProjects, carouselImages] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId } }),
    db.project.count({ where: { userId: session.userId, vertical, archivedAt: null } }),
    db.project.count({ where: { userId: session.userId, vertical, status: "COMPLETED", archivedAt: null } }),
    db.project.findMany({
      where: { userId: session.userId, vertical, archivedAt: null },
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
        resultStorageKey: true,
        sourceAsset: {
          select: { storageKey: true },
        },
        createdAt: true,
      },
    }),
    getActiveHomeCarouselImages(),
  ]);

  return (
    <DashboardHomeScreen
      userName={user?.name}
      projectCount={projectCount}
      completedCount={completedCount}
      carouselImages={carouselImages}
      recentProjects={recentProjects.map((project) => ({
        ...project,
        sourceImageUrl: project.sourceAsset?.storageKey ? storagePublicUrl(project.sourceAsset.storageKey) : project.sourceImageUrl,
        resultImageUrl: project.resultStorageKey ? storagePublicUrl(project.resultStorageKey) : project.resultImageUrl,
      }))}
    />
  );
}
