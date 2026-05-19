import { notFound } from "next/navigation";
import { GalleryBatchScreen } from "@/features/gallery/screens/gallery-batch-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { storagePublicUrl } from "@/lib/storage";

export default async function GalleryBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const session = await requireUserSession();
  const { batchId } = await params;
  const batch = await db.generationBatch.findFirst({
    where: { id: batchId, userId: session.userId },
    include: {
      style: {
        select: { name: true },
      },
      items: {
        include: {
          asset: { select: { title: true, originalName: true, storageKey: true } },
          project: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  return (
    <GalleryBatchScreen
      batch={{
        ...batch,
        items: batch.items.map((item) => ({
          ...item,
          asset: {
            title: item.asset.title,
            originalName: item.asset.originalName,
            fileUrl: storagePublicUrl(item.asset.storageKey),
          },
        })),
      }}
    />
  );
}
