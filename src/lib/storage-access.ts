import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { isPublicStorageKey } from "@/lib/storage";
import type { VerticalId } from "@/lib/verticals";
import { authorizeStorageKeyAccess, type StorageOwnershipKind } from "@/lib/storage-access-policy";

function storageKeyLookupValues(storageKey: string) {
  return Array.from(new Set([storageKey, storageKey.replace(/\//g, "\\")]));
}

/** Authorize one storage object without querying every upload table. */
export async function canReadStorageKey(storageKey: string, vertical: VerticalId) {
  if (isPublicStorageKey(storageKey)) return true;
  const session = await getSession();
  const storageUrl = `/api/storage/${storageKey}`;
  const storageKeys = storageKeyLookupValues(storageKey);

  return authorizeStorageKeyAccess({
    storageKey,
    publicAccess: false,
    session,
    owns: async (kind: StorageOwnershipKind, userId: string) => {
      if (kind === "source") {
        return Boolean(
          await db.productAsset.findFirst({
            where: { storageKey: { in: storageKeys }, userId, vertical },
            select: { id: true },
          }),
        );
      }

      if (kind === "result") {
        return Boolean(
          await db.project.findFirst({
            where: { userId, vertical, OR: [{ resultStorageKey: { in: storageKeys } }, { resultImageUrl: storageUrl }] },
            select: { id: true },
          }),
        );
      }

      if (kind === "style-reference") {
        return Boolean(
          await db.styleReferenceAsset.findFirst({
            where: { storageKey: { in: storageKeys }, userId, vertical },
            select: { id: true },
          }),
        );
      }

      return Boolean(
        await db.purchaseRequest.findFirst({
          where: { userId, OR: [{ receiptStorageKey: { in: storageKeys } }, { receiptImageUrl: storageUrl }] },
          select: { id: true },
        }),
      );
    },
  });
}
