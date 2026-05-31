import { randomBytes, randomUUID } from "crypto";
import type { Prisma } from "@/generated/prisma";
import {
  REFERRAL_PURCHASE_REWARD_CREDITS,
  SALES_CODE_BATCH_SIZE,
  SALES_CODE_CREDITS,
} from "@/lib/credits";
import { db } from "@/lib/db";

export function normalizeReferralCode(value: string) {
  return value.replace(/[\s-]+/g, "").trim().toUpperCase();
}

export function referralCodeFromUserId(userId: string) {
  return userId.slice(-5).toUpperCase();
}

export async function ensureUserReferralCode(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  const existingCode = user?.referralCode ? normalizeReferralCode(user.referralCode) : "";
  if (existingCode && /^[A-Z0-9]{5,12}$/.test(existingCode)) return existingCode;

  const referralCode = referralCodeFromUserId(userId);
  await db.user.update({ where: { id: userId }, data: { referralCode } });
  return referralCode;
}

function generateSalesReferralCode() {
  const value = randomBytes(4).readUInt32BE(0) % 100000000;
  return value.toString().padStart(8, "0");
}

export async function createSalesReferralCodeBatch({
  createdByAdminId,
  salespersonName,
  note,
}: {
  createdByAdminId: string;
  salespersonName?: string | null;
  note?: string | null;
}) {
  const batchKey = `SALE-${randomUUID().slice(0, 8).toUpperCase()}`;
  const codes: string[] = [];

  while (codes.length < SALES_CODE_BATCH_SIZE) {
    const code = generateSalesReferralCode();
    if (codes.includes(code)) continue;

    const existing = await db.salesReferralCode.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) codes.push(code);
  }

  await db.salesReferralCode.createMany({
    data: codes.map((code) => ({
      code,
      creditAmount: SALES_CODE_CREDITS,
      batchKey,
      salespersonName: salespersonName || null,
      note: note || null,
      createdByAdminId,
    })),
  });

  return { batchKey, codes };
}

type ReferralCodeApplyResult =
  | { status: "empty" }
  | { status: "referral" }
  | { status: "sales_code"; credited: number }
  | { status: "already_has_referral" }
  | { status: "sales_code_redeemed" }
  | { status: "invalid" };

export async function applyReferralOrSalesCodeForUser(
  tx: Prisma.TransactionClient,
  {
    userId,
    rawCode,
  }: {
    userId: string;
    rawCode: string;
  },
): Promise<ReferralCodeApplyResult> {
  const code = normalizeReferralCode(rawCode);
  if (!code) return { status: "empty" };

  const salesCode = await tx.salesReferralCode.findUnique({
    where: { code },
    select: { id: true, creditAmount: true, redeemedAt: true },
  });

  if (salesCode) {
    if (salesCode.redeemedAt) return { status: "sales_code_redeemed" };

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) return { status: "invalid" };

    const redeemed = await tx.salesReferralCode.updateMany({
      where: { id: salesCode.id, redeemedAt: null },
      data: {
        redeemedByUserId: userId,
        redeemedAt: new Date(),
      },
    });
    if (redeemed.count === 0) return { status: "sales_code_redeemed" };

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: salesCode.creditAmount } },
      select: { credits: true },
    });
    await tx.creditEvent.create({
      data: {
        userId,
        delta: salesCode.creditAmount,
        balanceBefore: updatedUser.credits - salesCode.creditAmount,
        balanceAfter: updatedUser.credits,
        reason: `اعتبار تست کد فروش ${code}`,
        source: "SALES_CODE",
      },
    });

    return { status: "sales_code", credited: salesCode.creditAmount };
  }

  const existingReferral = await tx.referral.findUnique({
    where: { inviteeId: userId },
    select: { id: true },
  });
  if (existingReferral) return { status: "already_has_referral" };

  const inviter = await tx.user.findFirst({
    where: { referralCode: code, id: { not: userId } },
    select: { id: true },
  });
  if (!inviter) return { status: "invalid" };

  await tx.referral.create({
    data: {
      inviterId: inviter.id,
      inviteeId: userId,
      codeUsed: code,
      rewardCredits: REFERRAL_PURCHASE_REWARD_CREDITS,
    },
  });

  return { status: "referral" };
}

export async function grantReferralRewardAfterFirstPurchase(
  tx: Prisma.TransactionClient,
  {
    userId,
    purchaseRequestId,
  }: {
    userId: string;
    purchaseRequestId: string;
  },
) {
  const referral = await tx.referral.findUnique({
    where: { inviteeId: userId },
    select: {
      id: true,
      inviterId: true,
      inviteeId: true,
      rewardCredits: true,
      rewardGrantedAt: true,
    },
  });
  if (!referral || referral.rewardGrantedAt) return { granted: false as const };

  const previousApprovedPurchases = await tx.purchaseRequest.count({
    where: {
      userId,
      status: "APPROVED",
      id: { not: purchaseRequestId },
    },
  });
  if (previousApprovedPurchases > 0) return { granted: false as const };

  const claimed = await tx.referral.updateMany({
    where: { id: referral.id, rewardGrantedAt: null },
    data: {
      rewardGrantedAt: new Date(),
      rewardPurchaseRequestId: purchaseRequestId,
    },
  });
  if (claimed.count === 0) return { granted: false as const };

  const rewardCredits = referral.rewardCredits || REFERRAL_PURCHASE_REWARD_CREDITS;
  const updatedInviter = await tx.user.update({
    where: { id: referral.inviterId },
    data: { credits: { increment: rewardCredits } },
    select: { credits: true },
  });
  await tx.creditEvent.create({
    data: {
      userId: referral.inviterId,
      delta: rewardCredits,
      balanceBefore: updatedInviter.credits - rewardCredits,
      balanceAfter: updatedInviter.credits,
      reason: "پاداش معرفی بعد از اولین خرید تاییدشده",
      source: "REFERRAL",
      referralId: referral.id,
    },
  });

  const updatedInvitee = await tx.user.update({
    where: { id: referral.inviteeId },
    data: { credits: { increment: rewardCredits } },
    select: { credits: true },
  });
  await tx.creditEvent.create({
    data: {
      userId: referral.inviteeId,
      delta: rewardCredits,
      balanceBefore: updatedInvitee.credits - rewardCredits,
      balanceAfter: updatedInvitee.credits,
      reason: "هدیه کد معرف بعد از اولین خرید تاییدشده",
      source: "REFERRAL",
      referralId: referral.id,
    },
  });

  return { granted: true as const, rewardCredits };
}
