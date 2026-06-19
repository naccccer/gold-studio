import { db } from "@/lib/db";

export const DEFAULT_STALE_PROCESSING_MINUTES = 90;

export function parseStaleProcessingMinutes(value = process.env.GENERATION_STALE_PROCESSING_MINUTES) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 5) {
    return DEFAULT_STALE_PROCESSING_MINUTES;
  }

  return Math.min(parsed, 24 * 60);
}

export async function getPublicHealth() {
  const checkedAt = new Date();

  try {
    await db.$queryRaw`SELECT 1`;
    return {
      status: 200,
      body: {
        ok: true,
        checkedAt: checkedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Health check failed", error);
    return {
      status: 503,
      body: {
        ok: false,
        checkedAt: checkedAt.toISOString(),
      },
    };
  }
}

export async function getDetailedHealthReport() {
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

    return {
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
    };
  } catch (error) {
    console.error("Detailed health check failed", error);
    return {
      ok: false,
      checkedAt: checkedAt.toISOString(),
      database: {
        ok: false,
        latencyMs: Date.now() - databaseStartedAt,
      },
      generation: null,
      storage: {
        driver: process.env.STORAGE_DRIVER?.trim().toLowerCase() === "s3" ? "s3" : "local",
      },
    };
  }
}
