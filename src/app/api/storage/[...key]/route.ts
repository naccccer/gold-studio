import { NextResponse } from "next/server";
import { canReadStorageKey } from "@/lib/storage-access";
import { isAllowedStorageKey, isPublicStorageKey, readStorageObject } from "@/lib/storage";
import { resolveVerticalFromRequest } from "@/lib/verticals";

const DISPLAY_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function storageFileName(storageKey: string) {
  return storageKey.split("/").pop()?.replace(/[^\w.-]/g, "_") || "download";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const storageKey = key.join("/");

  if (!isAllowedStorageKey(storageKey)) {
    return NextResponse.json({ error: "Invalid storage key." }, { status: 400 });
  }

  if (!(await canReadStorageKey(storageKey, resolveVerticalFromRequest(request)))) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const storedObject = await readStorageObject(storageKey, "application/octet-stream");
    const cacheControl = isPublicStorageKey(storageKey)
      ? "public, max-age=31536000, immutable"
      : "private, max-age=3600";
    const displayInline = DISPLAY_IMAGE_MIME_TYPES.has(storedObject.mimeType);

    return new Response(new Uint8Array(storedObject.buffer), {
      headers: {
        "Cache-Control": cacheControl,
        "Content-Disposition": displayInline ? "inline" : `attachment; filename="${storageFileName(storageKey)}"`,
        "Content-Type": displayInline ? storedObject.mimeType : "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[storage-object-read-failed]", { storageKey, error });
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
