import { db } from "@/lib/db";
import { pruneImageThumbnailCache, warmImageThumbnails } from "@/lib/image-thumbnails";

const MAX_ATTEMPTS = 3;
const STALE_JOB_MS = 10 * 60 * 1000;
const DEFAULT_CACHE_MAX_BYTES = 5 * 1024 * 1024 * 1024;
const CACHE_PRUNE_INTERVAL_MS = 60 * 60 * 1000;
let lastCachePruneAt = 0;

function positiveEnvNumber(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function enqueueThumbnailJob(storageKey: string) {
  await db.thumbnailJob.upsert({
    where: { storageKey },
    create: { storageKey },
    update: {
      status: "QUEUED",
      attemptCount: 0,
      errorMessage: null,
      availableAt: new Date(),
      startedAt: null,
      finishedAt: null,
    },
  });
}

export async function removeThumbnailJob(storageKey: string) {
  await db.thumbnailJob.deleteMany({ where: { storageKey } });
}

async function recoverStaleThumbnailJobs() {
  const cutoff = new Date(Date.now() - STALE_JOB_MS);
  return db.thumbnailJob.updateMany({
    where: { status: "PROCESSING", startedAt: { lt: cutoff } },
    data: { status: "QUEUED", startedAt: null, availableAt: new Date() },
  });
}

export async function processNextThumbnailJob() {
  const recovery = await recoverStaleThumbnailJobs();
  const job = await db.thumbnailJob.findFirst({
    where: { status: "QUEUED", availableAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    select: { id: true, storageKey: true, attemptCount: true },
  });

  if (!job) return { processed: 0, failed: 0, recovered: recovery.count };

  const claimed = await db.thumbnailJob.updateMany({
    where: { id: job.id, status: "QUEUED" },
    data: { status: "PROCESSING", startedAt: new Date(), attemptCount: { increment: 1 } },
  });
  if (claimed.count === 0) return { processed: 0, failed: 0, recovered: recovery.count };

  try {
    await warmImageThumbnails(job.storageKey);
    await db.thumbnailJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", errorMessage: null, finishedAt: new Date() },
    });
    return { processed: 1, failed: 0, recovered: recovery.count };
  } catch (error) {
    const attemptCount = job.attemptCount + 1;
    const retry = attemptCount < MAX_ATTEMPTS;
    await db.thumbnailJob.update({
      where: { id: job.id },
      data: {
        status: retry ? "QUEUED" : "FAILED",
        errorMessage: error instanceof Error ? error.message : "Thumbnail warmup failed.",
        availableAt: retry ? new Date(Date.now() + attemptCount * 60_000) : new Date(),
        finishedAt: retry ? null : new Date(),
      },
    });
    console.error("[thumbnail-job-failed]", { storageKey: job.storageKey, attemptCount, retry, error });
    return { processed: 0, failed: 1, recovered: recovery.count };
  }
}

export async function maybeMaintainThumbnailCache() {
  if (Date.now() - lastCachePruneAt < CACHE_PRUNE_INTERVAL_MS) return null;
  lastCachePruneAt = Date.now();

  const maxBytes = positiveEnvNumber("THUMBNAIL_CACHE_MAX_BYTES", DEFAULT_CACHE_MAX_BYTES);
  const maxAgeDays = positiveEnvNumber("THUMBNAIL_CACHE_MAX_AGE_DAYS", 30);
  const result = await pruneImageThumbnailCache({ maxBytes, maxAgeMs: maxAgeDays * 24 * 60 * 60 * 1000 });
  await db.thumbnailJob.deleteMany({
    where: { status: "COMPLETED", finishedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  if (result.deleted > 0) console.info("[thumbnail-cache-pruned]", result);
  return result;
}
