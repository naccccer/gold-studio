import { db } from "@/lib/db";

export function referralCodeFromUserId(userId: string) {
  return userId.slice(-5).toLowerCase();
}

export async function ensureUserReferralCode(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode && /^[a-z0-9]{5}$/.test(user.referralCode)) return user.referralCode;

  const referralCode = referralCodeFromUserId(userId);
  await db.user.update({ where: { id: userId }, data: { referralCode } });
  return referralCode;
}
