export type StorageAccessRole = "USER" | "ADMIN" | "SALES";
export type StorageOwnershipKind = "source" | "result" | "style-reference" | "receipt";

export function storageOwnershipKind(storageKey: string): StorageOwnershipKind | null {
  const normalized = storageKey.replace(/\\/g, "/");
  if (normalized.startsWith("uploads/source/")) return "source";
  if (normalized.startsWith("uploads/result/")) return "result";
  if (normalized.startsWith("uploads/style-references/")) return "style-reference";
  if (normalized.startsWith("uploads/receipts/")) return "receipt";
  return null;
}

export async function authorizeStorageKeyAccess({
  storageKey,
  publicAccess,
  session,
  owns,
}: {
  storageKey: string;
  publicAccess: boolean;
  session: { userId: string; role: StorageAccessRole } | null;
  owns: (kind: StorageOwnershipKind, userId: string) => Promise<boolean>;
}) {
  if (publicAccess) return true;
  if (!session) return false;
  if (session.role === "ADMIN" || session.role === "SALES") return true;

  const kind = storageOwnershipKind(storageKey);
  return kind ? owns(kind, session.userId) : false;
}
