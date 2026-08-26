import { avalaiCostLookupConfigured, lookupAvalaiTransactionCosts } from "@/lib/ai/avalai-costs";
import { db } from "@/lib/db";

const LOOKUP_BATCH_SIZE = 100;
const LOOKUP_INTERVAL_MS = 30_000;
const MAX_LOOKUP_ATTEMPTS = 12;
const RETENTION_DAYS = 89;

export async function reconcilePendingProviderCosts() {
  if (!avalaiCostLookupConfigured()) return { attempted: 0, resolved: 0 };

  const now = new Date();
  const createdBefore = new Date(now.getTime() - 5_000);
  const attemptedBefore = new Date(now.getTime() - LOOKUP_INTERVAL_MS);
  const retainedAfter = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const events = await db.providerEvent.findMany({
    where: {
      provider: "avalai",
      requestId: { not: null },
      costResolvedAt: null,
      costLookupAttempts: { lt: MAX_LOOKUP_ATTEMPTS },
      createdAt: { gte: retainedAfter, lte: createdBefore },
      OR: [{ costLookupAttemptedAt: null }, { costLookupAttemptedAt: { lte: attemptedBefore } }],
    },
    orderBy: { createdAt: "asc" },
    take: LOOKUP_BATCH_SIZE,
    select: { id: true, requestId: true },
  });

  const requestIds = events.flatMap((event) => (event.requestId ? [event.requestId] : []));
  if (requestIds.length === 0) return { attempted: 0, resolved: 0 };

  try {
    const costs = await lookupAvalaiTransactionCosts(requestIds);
    const byRequestId = new Map(costs.map((cost) => [cost.requestId, cost]));
    let resolved = 0;

    await db.$transaction(
      events.map((event) => {
        const cost = event.requestId ? byRequestId.get(event.requestId) : null;
        if (cost) resolved += 1;

        return db.providerEvent.update({
          where: { id: event.id },
          data: cost
            ? {
                costUnit: cost.unit,
                costPaidIrt: cost.paidIrt,
                costGrantIrt: cost.grantIrt,
                costResolvedAt: now,
                costLookupAttemptedAt: now,
                costLookupAttempts: { increment: 1 },
              }
            : {
                costLookupAttemptedAt: now,
                costLookupAttempts: { increment: 1 },
              },
        });
      }),
    );

    return { attempted: events.length, resolved };
  } catch (error) {
    await db.providerEvent.updateMany({
      where: { id: { in: events.map((event) => event.id) } },
      data: { costLookupAttemptedAt: now, costLookupAttempts: { increment: 1 } },
    });
    console.error("[provider-cost-reconcile-failed]", { count: events.length, error });
    return { attempted: events.length, resolved: 0 };
  }
}
