import { ProjectsListScreen, type ProjectListItem } from "@/features/projects/screens/projects-list-screen";
import { redirect } from "next/navigation";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { storagePublicUrl, storageThumbnailUrlFromKeyOrUrl } from "@/lib/storage";
import { getVerticalContent } from "@/lib/vertical-content";
import { projectGenerationTiming } from "@/lib/generation/timing";

const PAGE_SIZE = 24;

export default async function ProjectsPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const content = getVerticalContent(vertical);
  const params = await searchParams;
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const where = { userId: session.userId, vertical, archivedAt: null };
  const [projectRows, totalItems] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        style: {
          select: { name: true },
        },
        sourceAsset: {
          select: { storageKey: true },
        },
      },
    }),
    db.project.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (page > totalPages) redirect(totalPages > 1 ? `/projects?page=${totalPages}` : "/projects");
  const projects = projectRows.map((project) => ({
    ...project,
    sourceImageUrl: project.sourceAsset?.storageKey ? storagePublicUrl(project.sourceAsset.storageKey) : project.sourceImageUrl,
    resultImageUrl: project.resultStorageKey ? storagePublicUrl(project.resultStorageKey) : project.resultImageUrl,
    sourceThumbnailUrl: storageThumbnailUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl, "card"),
    resultThumbnailUrl: storageThumbnailUrlFromKeyOrUrl(project.resultStorageKey, project.resultImageUrl, "card"),
    generationDurationSeconds: projectGenerationTiming(project).totalSeconds,
  })) as ProjectListItem[];

  return (
    <ProjectsListScreen
      projects={projects}
      content={content}
      pagination={{
        page,
        totalPages,
        totalItems,
        previousHref: page > 1 ? `/projects?page=${page - 1}` : null,
        nextHref: page < totalPages ? `/projects?page=${page + 1}` : null,
      }}
    />
  );
}
