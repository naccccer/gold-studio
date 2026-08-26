import { createHash } from "node:crypto";
import { canReadStorageKey } from "@/lib/storage-access";
import { getImageThumbnail, isImageThumbnailPreset } from "@/lib/image-thumbnails";
import { isAllowedStorageKey } from "@/lib/storage";
import { thumbnailSignatureSecret, verifyThumbnailSignature } from "@/lib/thumbnail-signature";
import { resolveVerticalFromRequest } from "@/lib/verticals";

export async function GET(request: Request, context: { params: Promise<{ preset: string; key: string[] }> }) {
  const { preset, key } = await context.params;
  const storageKey = key.join("/");

  if (!isImageThumbnailPreset(preset) || !isAllowedStorageKey(storageKey)) {
    return Response.json({ error: "File not found." }, { status: 404 });
  }

  const authStartedAt = performance.now();
  const url = new URL(request.url);
  const expiresAt = Number.parseInt(url.searchParams.get("expires") ?? "", 10);
  const signature = url.searchParams.get("signature") ?? "";
  const secret = thumbnailSignatureSecret();
  const signedAccess = Boolean(
    secret &&
      signature &&
      verifyThumbnailSignature({ storageKey, preset, expiresAt, signature, secret }),
  );

  if (!signedAccess && !(await canReadStorageKey(storageKey, resolveVerticalFromRequest(request)))) {
    return Response.json({ error: "File not found." }, { status: 404 });
  }
  const authDurationMs = performance.now() - authStartedAt;

  try {
    const thumbnail = await getImageThumbnail(storageKey, preset);
    const etag = `"${createHash("sha256").update(thumbnail.buffer).digest("base64url")}"`;
    const authMode = signedAccess ? "SIGNED" : "SESSION";
    const serverTiming = `auth;dur=${authDurationMs.toFixed(1)};desc=${authMode}, thumbnail;dur=${thumbnail.durationMs.toFixed(1)};desc=${thumbnail.cacheStatus}`;
    const headers = {
      "Cache-Control": "private, max-age=86400",
      ETag: etag,
      "Server-Timing": serverTiming,
      "X-Thumbnail-Cache": thumbnail.cacheStatus,
      "X-Thumbnail-Auth": authMode,
    };

    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(new Uint8Array(thumbnail.buffer), {
      headers: {
        ...headers,
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[image-thumbnail-failed]", { storageKey, preset, error });
    return Response.json({ error: "File not found." }, { status: 404 });
  }
}
