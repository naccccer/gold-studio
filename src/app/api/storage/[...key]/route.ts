import { NextResponse } from "next/server";
import { isAllowedStorageKey, readStorageObject } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const storageKey = key.join("/");

  if (!isAllowedStorageKey(storageKey)) {
    return NextResponse.json({ error: "Invalid storage key." }, { status: 400 });
  }

  try {
    const storedObject = await readStorageObject(storageKey, "application/octet-stream");
    return new Response(new Uint8Array(storedObject.buffer), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": storedObject.mimeType,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
