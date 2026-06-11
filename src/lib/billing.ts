import type { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { NO_CREDITS_ERROR } from "@/lib/credits";

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
  provider,
  operation,
  status,
  model,
  statusDetail,
  errorMessage,
  retryCount = 0,
}: {
  projectId?: string | null;
  provider?: string | null;
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
      provider: provider || "liara",
      operation,
      status,
      model: model || null,
      statusDetail: statusDetail || null,
      errorMessage: errorMessage || null,
      retryCount,
    },
  });
}

export async function reserveGenerationCredit({
  userId,
  projectId,
  batchId,
}: {
  userId: string;
  projectId?: string | null;
  batchId?: string | null;
}) {
  const now = new Date();

  return db.$transaction(async (tx) => {
    const subscriptions = await tx.$queryRaw<
      Array<{
        id: string;
        creditsPerPeriod: number;
        creditsUsedThisPeriod: number;
        reservedCredits: number;
      }>
    >`
      SELECT id, creditsPerPeriod, creditsUsedThisPeriod, reservedCredits
      FROM \`UserSubscription\`
      WHERE userId = ${userId}
        AND status = 'ACTIVE'
        AND currentPeriodStart <= ${now}
        AND currentPeriodEnd > ${now}
      ORDER BY currentPeriodEnd ASC
      LIMIT 5
      FOR UPDATE
    `;
    const subscription = subscriptions.find((item) => item.creditsUsedThisPeriod + item.reservedCredits < item.creditsPerPeriod);

    if (subscription) {
      const updatedSubscription = await tx.userSubscription.updateMany({
        where: {
          id: subscription.id,
          reservedCredits: subscription.reservedCredits,
        },
        data: { reservedCredits: { increment: 1 } },
      });
      if (updatedSubscription.count === 0) {
        return { ok: false as const, error: NO_CREDITS_ERROR };
      }
      const reservation = await tx.generationCreditReservation.create({
        data: {
          userId,
          projectId: projectId || null,
          batchId: batchId || null,
          source: "SUBSCRIPTION",
          subscriptionId: subscription.id,
        },
      });

      return { ok: true as const, reservationId: reservation.id, source: "SUBSCRIPTION" as const };
    }

    const [user] = await tx.$queryRaw<Array<{ id: string; credits: number; reservedCredits: number }>>`
      SELECT id, credits, reservedCredits
      FROM \`User\`
      WHERE id = ${userId}
      LIMIT 1
      FOR UPDATE
    `;

    if (!user || user.credits - user.reservedCredits < 1) {
      return { ok: false as const, error: NO_CREDITS_ERROR };
    }

    const updatedUser = await tx.user.updateMany({
      where: { id: userId, reservedCredits: user.reservedCredits },
      data: { reservedCredits: { increment: 1 } },
    });
    if (updatedUser.count === 0) {
      return { ok: false as const, error: NO_CREDITS_ERROR };
    }
    const reservation = await tx.generationCreditReservation.create({
      data: {
        userId,
        projectId: projectId || null,
        batchId: batchId || null,
        source: "CREDIT_BALANCE",
      },
    });

    return { ok: true as const, reservationId: reservation.id, source: "CREDIT_BALANCE" as const };
  });
}

export async function attachGenerationCreditReservation({
  reservationId,
  projectId,
  batchId,
}: {
  reservationId: string;
  projectId?: string | null;
  batchId?: string | null;
}) {
  await db.generationCreditReservation.updateMany({
    where: { id: reservationId, status: "RESERVED" },
    data: {
      projectId: projectId || undefined,
      batchId: batchId || undefined,
    },
  });
}

async function getReservedGenerationCredit(
  tx: Prisma.TransactionClient,
  {
    reservationId,
    projectId,
  }: {
    reservationId?: string | null;
    projectId?: string | null;
  },
) {
  if (reservationId) {
    return tx.generationCreditReservation.findFirst({
      where: { id: reservationId, status: "RESERVED" },
      orderBy: { createdAt: "desc" },
    });
  }

  if (projectId) {
    return tx.generationCreditReservation.findFirst({
      where: { projectId, status: "RESERVED" },
      orderBy: { createdAt: "desc" },
    });
  }

  return null;
}

export async function captureGenerationCreditReservation({
  reservationId,
  projectId,
}: {
  reservationId?: string | null;
  projectId?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const reservation = await getReservedGenerationCredit(tx, { reservationId, projectId });
    if (!reservation) {
      return { ok: false as const, error: "NO_RESERVED_CREDIT" };
    }

    if (reservation.source === "SUBSCRIPTION") {
      const subscription = reservation.subscriptionId
        ? await tx.userSubscription.findUnique({ where: { id: reservation.subscriptionId } })
        : null;
      if (!subscription) {
        await tx.generationCreditReservation.update({
          where: { id: reservation.id },
          data: { status: "RELEASED", releasedAt: new Date() },
        });
        return { ok: false as const, error: "SUBSCRIPTION_NOT_FOUND" };
      }

      await tx.userSubscription.update({
        where: { id: subscription.id },
        data: {
          reservedCredits: { decrement: 1 },
          creditsUsedThisPeriod: { increment: 1 },
        },
      });
      await tx.creditEvent.create({
        data: {
          userId: reservation.userId,
          delta: -1,
          balanceBefore: Math.max(1, subscription.creditsPerPeriod - subscription.creditsUsedThisPeriod),
          balanceAfter: Math.max(0, subscription.creditsPerPeriod - subscription.creditsUsedThisPeriod - 1),
          reason: "مصرف اعتبار اشتراک پس از ساخت موفق خروجی",
          source: "SUBSCRIPTION",
          packageId: subscription.packageId,
          subscriptionId: subscription.id,
        },
      });
    } else {
      const user = await tx.user.findUnique({
        where: { id: reservation.userId },
        select: { credits: true },
      });
      if (!user) {
        await tx.generationCreditReservation.update({
          where: { id: reservation.id },
          data: { status: "RELEASED", releasedAt: new Date() },
        });
        return { ok: false as const, error: "USER_NOT_FOUND" };
      }

      await tx.user.update({
        where: { id: reservation.userId },
        data: {
          reservedCredits: { decrement: 1 },
          credits: { decrement: 1 },
        },
      });
      await tx.creditEvent.create({
        data: {
          userId: reservation.userId,
          delta: -1,
          balanceBefore: user.credits,
          balanceAfter: user.credits - 1,
          reason: "مصرف اعتبار کیف پول پس از ساخت موفق خروجی",
          source: "GENERATION",
        },
      });
    }

    await tx.generationCreditReservation.update({
      where: { id: reservation.id },
      data: { status: "CAPTURED", capturedAt: new Date() },
    });

    return { ok: true as const, reservationId: reservation.id };
  });
}

export async function releaseGenerationCreditReservation({
  reservationId,
  projectId,
}: {
  reservationId?: string | null;
  projectId?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const reservation = await getReservedGenerationCredit(tx, { reservationId, projectId });
    if (!reservation) {
      return { ok: false as const, error: "NO_RESERVED_CREDIT" };
    }

    if (reservation.source === "SUBSCRIPTION" && reservation.subscriptionId) {
      await tx.userSubscription.update({
        where: { id: reservation.subscriptionId },
        data: { reservedCredits: { decrement: 1 } },
      });
    }

    if (reservation.source === "CREDIT_BALANCE") {
      await tx.user.update({
        where: { id: reservation.userId },
        data: { reservedCredits: { decrement: 1 } },
      });
    }

    await tx.generationCreditReservation.update({
      where: { id: reservation.id },
      data: { status: "RELEASED", releasedAt: new Date() },
    });

    return { ok: true as const, reservationId: reservation.id };
  });
}

export async function getAvailableGenerationCredits(userId: string) {
  const summary = await getUserCreditSummary(userId);
  return summary.totalAvailableCredits;
}

export async function getUserCreditSummary(userId: string) {
  const now = new Date();
  const [user, subscriptions] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { credits: true, reservedCredits: true } }),
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
        reservedCredits: true,
        currentPeriodEnd: true,
        package: { select: { title: true, colorPreset: true } },
      },
    }),
  ]);

  const subscriptionCredits = subscriptions.reduce(
    (sum, subscription) =>
      sum + Math.max(0, subscription.creditsPerPeriod - subscription.creditsUsedThisPeriod - subscription.reservedCredits),
    0,
  );
  const walletCredits = Math.max(0, (user?.credits ?? 0) - (user?.reservedCredits ?? 0));

  return {
    walletCredits,
    reservedWalletCredits: user?.reservedCredits ?? 0,
    subscriptionCredits,
    totalAvailableCredits: subscriptionCredits + walletCredits,
    activeSubscription: subscriptions[0]
      ? {
          title: subscriptions[0].package.title,
          colorPreset: subscriptions[0].package.colorPreset,
          creditsPerPeriod: subscriptions[0].creditsPerPeriod,
          creditsUsedThisPeriod: subscriptions[0].creditsUsedThisPeriod,
          reservedCredits: subscriptions[0].reservedCredits,
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
