import type { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";

export const NO_CREDITS_ERROR = "اعتبار کافی برای ساخت خروجی ندارید. از بخش خرید اعتبار یا اشتراک، بسته یا اشتراک جدید ثبت کنید.";

export async function logAdminAudit({
  actorAdminId,
  action,
  targetType,
  targetId,
  summary,
  metadata,
}: {
  actorAdminId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await db.adminAuditEvent.create({
    data: {
      actorAdminId: actorAdminId || null,
      action,
      targetType,
      targetId,
      summary,
      metadata: metadata ?? undefined,
    },
  });
}

export async function logProviderEvent({
  projectId,
  operation,
  status,
  model,
  statusDetail,
  errorMessage,
  retryCount = 0,
}: {
  projectId?: string | null;
  operation: string;
  status: "SUCCESS" | "FAILED";
  model?: string | null;
  statusDetail?: string | null;
  errorMessage?: string | null;
  retryCount?: number;
}) {
  await db.providerEvent.create({
    data: {
      projectId: projectId || null,
      operation,
      status,
      model: model || null,
      statusDetail: statusDetail || null,
      errorMessage: errorMessage || null,
      retryCount,
    },
  });
}

export async function consumeGenerationCredit(userId: string) {
  const now = new Date();

  return db.$transaction(async (tx) => {
    const subscriptions = await tx.userSubscription.findMany({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodStart: { lte: now },
        currentPeriodEnd: { gt: now },
      },
      orderBy: { currentPeriodEnd: "asc" },
      take: 5,
    });
    const subscription = subscriptions.find((item) => item.creditsUsedThisPeriod < item.creditsPerPeriod);

    if (subscription) {
      const balanceBefore = subscription.creditsPerPeriod - subscription.creditsUsedThisPeriod;
      await tx.userSubscription.update({
        where: { id: subscription.id },
        data: { creditsUsedThisPeriod: { increment: 1 } },
      });
      await tx.creditEvent.create({
        data: {
          userId,
          delta: -1,
          balanceBefore,
          balanceAfter: balanceBefore - 1,
          reason: "مصرف اعتبار اشتراک برای ساخت خروجی",
          source: "SUBSCRIPTION",
          packageId: subscription.packageId,
          subscriptionId: subscription.id,
        },
      });

      return { ok: true as const, source: "SUBSCRIPTION" as const };
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < 1) {
      return { ok: false as const, error: NO_CREDITS_ERROR };
    }

    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
    });
    await tx.creditEvent.create({
      data: {
        userId,
        delta: -1,
        balanceBefore: user.credits,
        balanceAfter: user.credits - 1,
        reason: "مصرف اعتبار خریداری‌شده برای ساخت خروجی",
        source: "GENERATION",
      },
    });

    return { ok: true as const, source: "CREDIT_BALANCE" as const };
  });
}

export async function getAvailableGenerationCredits(userId: string) {
  const summary = await getUserCreditSummary(userId);
  return summary.totalAvailableCredits;
}

export async function getUserCreditSummary(userId: string) {
  const now = new Date();
  const [user, subscriptions] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { credits: true } }),
    db.userSubscription.findMany({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodStart: { lte: now },
        currentPeriodEnd: { gt: now },
      },
      orderBy: { currentPeriodEnd: "desc" },
      select: {
        id: true,
        creditsPerPeriod: true,
        creditsUsedThisPeriod: true,
        currentPeriodEnd: true,
        package: { select: { title: true } },
      },
    }),
  ]);

  const subscriptionCredits = subscriptions.reduce(
    (sum, subscription) => sum + Math.max(0, subscription.creditsPerPeriod - subscription.creditsUsedThisPeriod),
    0,
  );

  return {
    walletCredits: user?.credits ?? 0,
    subscriptionCredits,
    totalAvailableCredits: subscriptionCredits + (user?.credits ?? 0),
    activeSubscription: subscriptions[0]
      ? {
          title: subscriptions[0].package.title,
          creditsPerPeriod: subscriptions[0].creditsPerPeriod,
          creditsUsedThisPeriod: subscriptions[0].creditsUsedThisPeriod,
          currentPeriodEnd: subscriptions[0].currentPeriodEnd,
        }
      : null,
  };
}

export function getSubscriptionPeriod(periodDays = 30) {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + periodDays);
  return { start, end };
}
