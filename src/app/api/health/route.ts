import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULT_STALE_PROCESSING_MINUTES = 45;

function parseStaleProcessingMinutes() {
  const parsed = Number.parseInt(process.env.GENERATION_STALE_PROCESSING_MINUTES ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 5) {
    return DEFAULT_STALE_PROCESSING_MINUTES;
  }

  return Math.min(parsed, 24 * 60);
}

export async function GET() {
  const checkedAt = new Date();
  const databaseStartedAt = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const staleProcessingMinutes = parseStaleProcessingMinutes();
    const staleCutoff = new Date(Date.now() - staleProcessingMinutes * 60 * 1000);
    const [
      queuedProjects,
      processingProjects,
      staleProcessingProjects,
      failedProjects24h,
      queuedBatches,
      processingBatches,
      staleProcessingBatches,
    ] = await Promise.all([
      db.project.count({ where: { status: "QUEUED", archivedAt: null } }),
      db.project.count({ where: { status: "PROCESSING", archivedAt: null } }),
      db.project.count({
        where: {
          status: "PROCESSING",
          archivedAt: null,
          resultImageUrl: null,
          updatedAt: { lt: staleCutoff },
        },
      }),
      db.project.count({
        where: {
          status: "FAILED",
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      db.generationBatch.count({ where: { status: "QUEUED" } }),
      db.generationBatch.count({ where: { status: "PROCESSING" } }),
      db.generationBatch.count({
        where: {
          status: "PROCESSING",
          updatedAt: { lt: staleCutoff },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      checkedAt: checkedAt.toISOString(),
      database: {
        ok: true,
        latencyMs: Date.now() - databaseStartedAt,
      },
      generation: {
        queuedProjects,
        processingProjects,
        staleProcessingProjects,
        failedProjects24h,
        queuedBatches,
        processingBatches,
        staleProcessingBatches,
        staleProcessingMinutes,
        workerConfigured: Boolean(process.env.GENERATION_WORKER_SECRET?.trim()),
      },
      storage: {
        driver: process.env.STORAGE_DRIVER?.trim().toLowerCase() === "s3" ? "s3" : "local",
      },
    });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      {
        ok: false,
        checkedAt: checkedAt.toISOString(),
        database: {
          ok: false,
          latencyMs: Date.now() - databaseStartedAt,
        },
      },
      { status: 503 },
    );
  }
}
