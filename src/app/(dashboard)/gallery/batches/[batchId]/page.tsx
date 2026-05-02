import { notFound } from "next/navigation";
import { GalleryBatchScreen, type GalleryBatchDetail } from "@/features/gallery/screens/gallery-batch-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function GalleryBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const session = await requireUserSession();
  const { batchId } = await params;
  const batch = (await db.generationBatch.findFirst({
    where: { id: batchId, userId: session.userId },
    include: {
      style: {
        select: { name: true },
      },
      items: {
        include: {
          asset: { select: { title: true, originalName: true } },
          project: { select: { id: true, title: true, status: true } },
        },
      },
    },
  })) as GalleryBatchDetail | null;

  if (!batch) {
    notFound();
  }

  return <GalleryBatchScreen batch={batch} />;
}
