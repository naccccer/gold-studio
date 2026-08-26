import { StyleReferenceGalleryScreen } from "@/features/style-references/screens/style-reference-gallery-screen";
import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { getReadyStyleReferenceSamples } from "@/lib/ready-style-reference-samples";
import { storageThumbnailUrl, storageThumbnailUrlFromKeyOrUrl } from "@/lib/storage";

const readySampleOriginalNamePrefix = "ready-sample:";
const PAGE_SIZE = 24;

export default async function StyleReferencesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; page?: string }>;
}) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const params = await searchParams;
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = {
    userId: session.userId,
    vertical,
    status: "READY" as const,
    archivedAt: null,
    OR: [{ originalName: null }, { NOT: { originalName: { startsWith: readySampleOriginalNamePrefix } } }],
  };
  const [assets, totalItems, readySamples] = await Promise.all([
    db.styleReferenceAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        storageKey: true,
        title: true,
        originalName: true,
        createdAt: true,
      },
    }),
    db.styleReferenceAsset.count({ where }),
    getReadyStyleReferenceSamples(vertical),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (page > totalPages) {
    redirect(totalPages > 1 ? `/account/style-references?page=${totalPages}` : "/account/style-references");
  }

  return (
    <StyleReferenceGalleryScreen
      assets={assets.map((asset) => ({ ...asset, fileUrl: storageThumbnailUrl(asset.storageKey, "card") }))}
      emptySamples={readySamples.map((sample) => ({
        id: sample.id,
        fileUrl: storageThumbnailUrlFromKeyOrUrl(null, sample.fileUrl, "card") || sample.fileUrl,
        title: sample.title,
      }))}
      error={params?.error}
      pagination={{
        page,
        totalPages,
        totalItems,
        previousHref: page > 1 ? `/account/style-references?page=${page - 1}` : null,
        nextHref: page < totalPages ? `/account/style-references?page=${page + 1}` : null,
      }}
    />
  );
}
