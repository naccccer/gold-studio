import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { isPublicStorageKey } from "@/lib/storage";
import type { VerticalId } from "@/lib/verticals";

function storageKeyLookupValues(storageKey: string) {
  return Array.from(new Set([storageKey, storageKey.replace(/\//g, "\\")]));
}

/** Authorize one storage object without querying every upload table. */
export async function canReadStorageKey(storageKey: string, vertical: VerticalId) {
  if (isPublicStorageKey(storageKey)) return true;

  const session = await getSession();
  if (!session) return false;
  if (session.role === "ADMIN" || session.role === "SALES") return true;

  const storageUrl = `/api/storage/${storageKey}`;
  const storageKeys = storageKeyLookupValues(storageKey);
  const normalizedKey = storageKey.replace(/\\/g, "/");

  if (normalizedKey.startsWith("uploads/source/")) {
    return Boolean(
      await db.productAsset.findFirst({
        where: { storageKey: { in: storageKeys }, userId: session.userId, vertical },
        select: { id: true },
      }),
    );
  }

  if (normalizedKey.startsWith("uploads/result/")) {
    return Boolean(
      await db.project.findFirst({
        where: {
          userId: session.userId,
          vertical,
          OR: [{ resultStorageKey: { in: storageKeys } }, { resultImageUrl: storageUrl }],
        },
        select: { id: true },
      }),
    );
  }

  if (normalizedKey.startsWith("uploads/style-references/")) {
    return Boolean(
      await db.styleReferenceAsset.findFirst({
        where: { storageKey: { in: storageKeys }, userId: session.userId, vertical },
        select: { id: true },
      }),
    );
  }

  if (normalizedKey.startsWith("uploads/receipts/")) {
    return Boolean(
      await db.purchaseRequest.findFirst({
        where: {
          userId: session.userId,
          OR: [{ receiptStorageKey: { in: storageKeys } }, { receiptImageUrl: storageUrl }],
        },
        select: { id: true },
      }),
    );
  }

  return false;
}
