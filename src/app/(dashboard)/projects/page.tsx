import { ProjectsListScreen, type ProjectListItem } from "@/features/projects/screens/projects-list-screen";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { storagePublicUrl } from "@/lib/storage";
import { getVerticalContent } from "@/lib/vertical-content";

export default async function ProjectsPage() {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const content = getVerticalContent(vertical);

  const projects = (await db.project.findMany({
    where: { userId: session.userId, vertical, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      style: {
        select: { name: true },
      },
      sourceAsset: {
        select: { storageKey: true },
      },
    },
  })).map((project) => ({
    ...project,
    sourceImageUrl: project.sourceAsset?.storageKey ? storagePublicUrl(project.sourceAsset.storageKey) : project.sourceImageUrl,
    resultImageUrl: project.resultStorageKey ? storagePublicUrl(project.resultStorageKey) : project.resultImageUrl,
  })) as ProjectListItem[];

  return <ProjectsListScreen projects={projects} content={content} />;
}
