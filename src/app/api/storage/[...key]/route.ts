import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isAllowedStorageKey, isPublicStorageKey, readStorageObject } from "@/lib/storage";

function storageKeyLookupValues(storageKey: string) {
  return Array.from(new Set([storageKey, storageKey.replace(/\//g, "\\")]));
}

async function canReadStorageKey(storageKey: string) {
  if (isPublicStorageKey(storageKey)) {
    return true;
  }

  const session = await getSession();
  if (!session) {
    return false;
  }

  if (session.role === "ADMIN") {
    const storageUrl = `/api/storage/${storageKey}`;
    const storageKeys = storageKeyLookupValues(storageKey);
    const knownObject = await Promise.all([
      db.productAsset.findFirst({ where: { storageKey: { in: storageKeys } }, select: { id: true } }),
      db.styleReferenceAsset.findFirst({ where: { storageKey: { in: storageKeys } }, select: { id: true } }),
      db.project.findFirst({ where: { sourceImageUrl: storageUrl }, select: { id: true } }),
      db.project.findFirst({ where: { resultStorageKey: { in: storageKeys } }, select: { id: true } }),
      db.project.findFirst({ where: { resultImageUrl: storageUrl }, select: { id: true } }),
      db.purchaseRequest.findFirst({ where: { receiptStorageKey: { in: storageKeys } }, select: { id: true } }),
      db.purchaseRequest.findFirst({ where: { receiptImageUrl: storageUrl }, select: { id: true } }),
    ]);

    return knownObject.some(Boolean);
  }

  const storageUrl = `/api/storage/${storageKey}`;
  const storageKeys = storageKeyLookupValues(storageKey);
  const ownedObject = await Promise.all([
    db.productAsset.findFirst({ where: { storageKey: { in: storageKeys }, userId: session.userId }, select: { id: true } }),
    db.styleReferenceAsset.findFirst({ where: { storageKey: { in: storageKeys }, userId: session.userId }, select: { id: true } }),
    db.project.findFirst({ where: { sourceImageUrl: storageUrl, userId: session.userId }, select: { id: true } }),
    db.project.findFirst({ where: { resultStorageKey: { in: storageKeys }, userId: session.userId }, select: { id: true } }),
    db.project.findFirst({ where: { resultImageUrl: storageUrl, userId: session.userId }, select: { id: true } }),
    db.purchaseRequest.findFirst({ where: { receiptStorageKey: { in: storageKeys }, userId: session.userId }, select: { id: true } }),
    db.purchaseRequest.findFirst({ where: { receiptImageUrl: storageUrl, userId: session.userId }, select: { id: true } }),
  ]);

  return ownedObject.some(Boolean);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const storageKey = key.join("/");

  if (!isAllowedStorageKey(storageKey)) {
    return NextResponse.json({ error: "Invalid storage key." }, { status: 400 });
  }

  if (!(await canReadStorageKey(storageKey))) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const storedObject = await readStorageObject(storageKey, "application/octet-stream");
    const cacheControl = isPublicStorageKey(storageKey)
      ? "public, max-age=31536000, immutable"
      : "private, max-age=3600";

    return new Response(new Uint8Array(storedObject.buffer), {
      headers: {
        "Cache-Control": cacheControl,
        "Content-Type": storedObject.mimeType,
      },
    });
  } catch (error) {
    console.error("[storage-object-read-failed]", { storageKey, error });
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
