import { db } from "@/lib/db";

export function referralCodeFromUserId(userId: string) {
  return `GS${userId.slice(-8).toUpperCase()}`;
}

export async function ensureUserReferralCode(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;

  const referralCode = referralCodeFromUserId(userId);
  await db.user.update({ where: { id: userId }, data: { referralCode } });
  return referralCode;
}
