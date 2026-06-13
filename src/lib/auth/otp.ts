import { createHash, randomInt } from "node:crypto";
import { normalizeDigits } from "@/lib/auth/identifier";
import { db } from "@/lib/db";
import { sendFarazOtpSms } from "@/lib/sms/faraz";

export type OtpPurpose = "SIGNUP" | "PASSWORD_RESET";

const OTP_EXPIRES_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

function getOtpSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET env var is required.");
  }
  return secret;
}

function hashOtpCode({ phone, purpose, code }: { phone: string; purpose: OtpPurpose; code: string }) {
  return createHash("sha256")
    .update(`${phone}:${purpose}:${code}:${getOtpSecret()}`)
    .digest("hex");
}

function normalizeOtpCode(value: FormDataEntryValue | string | null) {
  const code = normalizeDigits(String(value ?? "")).replace(/\D/g, "");
  return code.length === 6 ? code : null;
}

function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

export async function createOtpChallenge({ phone, purpose }: { phone: string; purpose: OtpPurpose }) {
  const code = generateOtpCode();
  const created = await db.otpChallenge.create({
    data: {
      phone,
      purpose,
      codeHash: hashOtpCode({ phone, purpose, code }),
      expiresAt: new Date(Date.now() + OTP_EXPIRES_MS),
    },
    select: { id: true },
  });

  try {
    await sendFarazOtpSms({ phone, code });
  } catch (error) {
    await db.otpChallenge.delete({ where: { id: created.id } }).catch(() => undefined);
    throw error;
  }
}

export async function getOtpResendDelaySeconds({ phone, purpose }: { phone: string; purpose: OtpPurpose }) {
  const latest = await db.otpChallenge.findFirst({
    where: {
      phone,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!latest) return 0;

  const elapsedMs = Date.now() - latest.createdAt.getTime();
  return elapsedMs >= OTP_RESEND_MS ? 0 : Math.ceil((OTP_RESEND_MS - elapsedMs) / 1000);
}

export async function verifyOtpChallenge({
  phone,
  purpose,
  code: rawCode,
}: {
  phone: string;
  purpose: OtpPurpose;
  code: FormDataEntryValue | string | null;
}) {
  const code = normalizeOtpCode(rawCode);
  if (!code) {
    return { ok: false as const, error: "کد تایید باید ۶ رقم باشد." };
  }

  const now = new Date();
  const activeChallenges = await db.otpChallenge.findMany({
    where: {
      phone,
      purpose,
      consumedAt: null,
      expiresAt: { gt: now },
      attempts: { lt: MAX_VERIFY_ATTEMPTS },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, codeHash: true },
  });

  if (activeChallenges.length === 0) {
    return { ok: false as const, error: "کد تایید منقضی شده است. دوباره کد بگیرید." };
  }

  const codeHash = hashOtpCode({ phone, purpose, code });
  const matched = activeChallenges.find((challenge) => challenge.codeHash === codeHash);

  if (!matched) {
    await db.otpChallenge.updateMany({
      where: {
        phone,
        purpose,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: MAX_VERIFY_ATTEMPTS },
      },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false as const, error: "کد تایید درست نیست." };
  }

  await db.otpChallenge.update({
    where: { id: matched.id },
    data: { consumedAt: now },
  });

  return { ok: true as const };
}
