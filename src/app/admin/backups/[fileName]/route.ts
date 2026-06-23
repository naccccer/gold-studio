import { readFile, stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { backupFilePath, isBackupFileName } from "@/lib/backups";
import { requireAdminSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> },
) {
  await requireAdminSession();
  const { fileName } = await context.params;
  const decodedFileName = decodeURIComponent(fileName);

  if (!isBackupFileName(decodedFileName)) {
    return NextResponse.json({ error: "Invalid backup file name." }, { status: 400 });
  }

  try {
    const filePath = backupFilePath(decodedFileName);
    const [buffer, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Length": String(fileStat.size),
        "Content-Disposition": `attachment; filename="${decodedFileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Backup not found." }, { status: 404 });
  }
}
