import type { Prisma, QualityReviewReason } from "@/generated/prisma";
import { analyzeQualityReviewImagesWithLiara, visionModel } from "@/lib/ai/vision";
import { getProviderSettings } from "@/lib/ai/provider-settings";
import { getGenerationCreditUnitCost } from "@/lib/credit-units";
import { db } from "@/lib/db";
import { createUserNotification } from "@/lib/notifications";
import { isAllowedStorageKey, readStorageObject } from "@/lib/storage";
import { readStoredUpload } from "@/lib/uploads";
import { normalizeVerticalId } from "@/lib/verticals";

const REVIEW_REASON_LABELS: Record<QualityReviewReason, string> = {
  PRODUCT_CHANGED: "محصول در خروجی عوض شده",
  DETAILS_MISSING: "جزئیات مهم محصول حذف شده",
  COLOR_OR_STONES_WRONG: "رنگ، سنگ یا جنس محصول اشتباه است",
  OTHER: "مشکل دیگر",
};

function errorText(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 1000) : "Quality review analysis failed.";
}

function resultStorageKeyFromUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const pathname = value.startsWith("http") ? new URL(value).pathname : value;
    const apiStoragePrefix = "/api/storage/";
    const uploadsPrefix = "/uploads/";
    const storageKey = pathname.startsWith(apiStoragePrefix)
      ? decodeURIComponent(pathname.slice(apiStoragePrefix.length))
      : pathname.startsWith(uploadsPrefix)
        ? `uploads/${decodeURIComponent(pathname.slice(uploadsPrefix.length))}`
        : null;

    return storageKey && isAllowedStorageKey(storageKey) ? storageKey : null;
  } catch {
    return null;
  }
}

async function lockUserCredits(tx: Prisma.TransactionClient, userId: string) {
  const [user] = await tx.$queryRaw<Array<{ id: string; credits: number }>>`
    SELECT id, credits
    FROM \`User\`
    WHERE id = ${userId}
    LIMIT 1
    FOR UPDATE
  `;

  return user ?? null;
}

export function normalizeQualityReviewReason(value: FormDataEntryValue | null): QualityReviewReason {
  const text = String(value ?? "");
  if (text === "DETAILS_MISSING" || text === "COLOR_OR_STONES_WRONG" || text === "OTHER") {
    return text;
  }

  return "PRODUCT_CHANGED";
}

export function qualityReviewReasonLabel(reason: QualityReviewReason) {
  return REVIEW_REASON_LABELS[reason] ?? REVIEW_REASON_LABELS.OTHER;
}

export async function analyzeQualityReviewRequest(reviewId: string) {
  const providerSettings = await getProviderSettings();
  const visionProvider = providerSettings.imageProvider;
  const usedVisionModel = visionModel(visionProvider);

  try {
    const review = await db.qualityReview.findUnique({
      where: { id: reviewId },
      include: {
        project: {
          include: {
            sourceAsset: { select: { storageKey: true, mimeType: true } },
          },
        },
      },
    });

    if (!review?.project.sourceAsset) {
      throw new Error("تصویر خام پروژه برای بررسی کیفیت پیدا نشد.");
    }

    const resultStorageKey = review.project.resultStorageKey || resultStorageKeyFromUrl(review.project.resultImageUrl);
    if (!resultStorageKey) {
      throw new Error("فایل خروجی پروژه برای بررسی کیفیت پیدا نشد.");
    }

    const [source, result] = await Promise.all([
      readStoredUpload(review.project.sourceAsset.storageKey, review.project.sourceAsset.mimeType),
      readStorageObject(resultStorageKey, "image/png"),
    ]);
    const metadata = await analyzeQualityReviewImagesWithLiara({
      sourceBuffer: source.buffer,
      sourceMimeType: source.mimeType,
      resultBuffer: result.buffer,
      resultMimeType: result.mimeType,
      provider: visionProvider,
    });

    await db.qualityReview.updateMany({
      where: { id: review.id, status: "PENDING" },
      data: {
        aiScore: metadata.identityScore,
        aiRecommendation: metadata.recommendation,
        aiSummary: metadata.summary,
        aiRaw: metadata as unknown as Prisma.InputJsonValue,
        aiModel: usedVisionModel,
        aiAnalyzedAt: new Date(),
        aiError: null,
      },
    });
  } catch (error) {
    await db.qualityReview.updateMany({
      where: { id: reviewId },
      data: {
        aiModel: usedVisionModel,
        aiAnalyzedAt: new Date(),
        aiError: errorText(error),
      },
    });
  }
}

export async function approveQualityReviewWithRefund({
  reviewId,
  adminId,
  adminNote,
}: {
  reviewId: string;
  adminId: string;
  adminNote?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const review = await tx.qualityReview.findFirst({
      where: { id: reviewId, status: "PENDING", refundCreditEventId: null },
      include: {
        project: { select: { id: true, title: true, vertical: true } },
      },
    });

    if (!review) {
      return null;
    }

    const capturedReservation = await tx.generationCreditReservation.findFirst({
      where: { projectId: review.projectId, status: "CAPTURED" },
      orderBy: { capturedAt: "desc" },
    });
    const reason = `بازگشت اعتبار بابت بررسی کیفیت پروژه ${review.project.title || review.project.id}`;
    const refundCreditUnits = capturedReservation?.creditUnits ?? getGenerationCreditUnitCost(normalizeVerticalId(review.project.vertical));
    let creditEvent;

    if (capturedReservation?.source === "SUBSCRIPTION" && capturedReservation.subscriptionId) {
      const subscription = await tx.userSubscription.findFirst({
        where: {
          id: capturedReservation.subscriptionId,
          userId: review.userId,
          status: "ACTIVE",
          currentPeriodEnd: { gt: new Date() },
          creditsUsedThisPeriod: { gt: 0 },
        },
      });

      if (subscription) {
        await tx.userSubscription.update({
          where: { id: subscription.id },
          data: {
            creditsUsedThisPeriod: { decrement: capturedReservation.creditUnits },
            ...(capturedReservation.reservesProject && subscription.projectsUsedThisPeriod > 0
              ? { projectsUsedThisPeriod: { decrement: 1 } }
              : {}),
          },
        });
        creditEvent = await tx.creditEvent.create({
          data: {
            userId: review.userId,
            actorAdminId: adminId,
            delta: capturedReservation.creditUnits,
            balanceBefore: Math.max(0, subscription.creditsPerPeriod - subscription.creditsUsedThisPeriod),
            balanceAfter: Math.max(0, subscription.creditsPerPeriod - subscription.creditsUsedThisPeriod + capturedReservation.creditUnits),
            reason,
            source: "QUALITY_REFUND",
            packageId: subscription.packageId,
            subscriptionId: subscription.id,
          },
        });
      }
    }

    if (!creditEvent) {
      const user = await lockUserCredits(tx, review.userId);
      if (!user) {
        return null;
      }

      await tx.user.update({
        where: { id: review.userId },
        data: { credits: { increment: refundCreditUnits } },
      });
      creditEvent = await tx.creditEvent.create({
        data: {
          userId: review.userId,
          actorAdminId: adminId,
          delta: refundCreditUnits,
          balanceBefore: user.credits,
          balanceAfter: user.credits + refundCreditUnits,
          reason,
          source: "QUALITY_REFUND",
        },
      });
    }

    await tx.qualityReview.update({
      where: { id: review.id },
      data: {
        status: "APPROVED",
        reviewedByAdminId: adminId,
        adminNote: adminNote || null,
        refundCreditEventId: creditEvent.id,
        creditRefundedAt: new Date(),
      },
    });

    await createUserNotification(
      {
        userId: review.userId,
        title: "اعتبار شما برگشت داده شد",
        body: "درخواست بررسی خروجی تایید شد و اعتبار مصرف‌شده به حساب شما برگشت.",
        type: "QUALITY_REVIEW",
        source: "QUALITY_REVIEW",
        href: `/projects/${review.projectId}`,
        createdByAdminId: adminId,
        metadata: { reviewId: review.id, projectId: review.projectId, creditEventId: creditEvent.id },
      },
      tx,
    );

    return { review, creditEvent };
  });
}

export async function rejectQualityReview({
  reviewId,
  adminId,
  adminNote,
}: {
  reviewId: string;
  adminId: string;
  adminNote?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const review = await tx.qualityReview.findFirst({
      where: { id: reviewId, status: "PENDING" },
      include: {
        project: { select: { id: true, title: true } },
      },
    });

    if (!review) {
      return null;
    }

    await tx.qualityReview.update({
      where: { id: review.id },
      data: {
        status: "REJECTED",
        reviewedByAdminId: adminId,
        adminNote: adminNote || null,
      },
    });

    await createUserNotification(
      {
        userId: review.userId,
        title: "درخواست بررسی شد",
        body: adminNote || "درخواست بررسی خروجی شما بررسی شد و بازگشت اعتبار برای این پروژه تایید نشد.",
        type: "QUALITY_REVIEW",
        source: "QUALITY_REVIEW",
        href: `/projects/${review.projectId}`,
        createdByAdminId: adminId,
        metadata: { reviewId: review.id, projectId: review.projectId },
      },
      tx,
    );

    return review;
  });
}
