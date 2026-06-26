"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { normalizeLoginIdentifier, normalizePhone } from "@/lib/auth/identifier";
import { createOtpChallenge, getOtpResendDelaySeconds, verifyOtpChallenge, type OtpPurpose } from "@/lib/auth/otp";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSession, createSession, postLoginPathForRole } from "@/lib/auth/session";
import { INITIAL_SIGNUP_CREDITS } from "@/lib/credits";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { referralCodeFromUserId } from "@/lib/referrals";
import { FarazSmsConfigError, FarazSmsSendError } from "@/lib/sms/faraz";

export type AuthFormState = {
  error?: string;
};

export type OtpFormState = {
  step: "phone" | "verify" | "password";
  phone?: string;
  error?: string;
  message?: string;
  resendDelaySeconds?: number;
  signupProof?: string;
};

const PASSWORD_MIN_LENGTH = 6;
const SIGNUP_PROOF_EXPIRES_MS = 10 * 60 * 1000;
const INVALID_PHONE_ERROR = "شماره موبایل را درست وارد کنید.";
const DUPLICATE_ACCOUNT_ERROR = "این شماره قبلا ثبت شده است. از صفحه ورود استفاده کنید.";
const BAD_LOGIN_ERROR = "اطلاعات ورود درست نیست.";
const PASSWORD_LENGTH_ERROR = "رمز عبور باید حداقل ۶ کاراکتر باشد.";
const PASSWORD_CONFIRM_ERROR = "تکرار رمز عبور با رمز جدید یکسان نیست.";
const SMS_CONFIG_ERROR = "ارسال پیامک هنوز تنظیم نشده است. کلید API و کد الگوی فراز اس‌ام‌اس را در env وارد کنید.";
const SMS_SEND_ERROR = "ارسال پیامک ناموفق بود. چند دقیقه دیگر دوباره تلاش کنید.";
const OTP_SENT_MESSAGE = "کد تایید ارسال شد.";

function friendlySmsError(error: unknown) {
  if (error instanceof FarazSmsConfigError) return SMS_CONFIG_ERROR;
  if (error instanceof FarazSmsSendError) return error.publicMessage;
  return SMS_SEND_ERROR;
}

function normalizeFormPhone(value: FormDataEntryValue | null) {
  return normalizePhone(String(value ?? ""));
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET env var is required.");
  }
  return secret;
}

function signSignupProofPayload(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function createSignupProof(phone: string) {
  const expiresAt = Date.now() + SIGNUP_PROOF_EXPIRES_MS;
  const payload = `${phone}:${expiresAt}`;
  return `${expiresAt}.${signSignupProofPayload(payload)}`;
}

function verifySignupProof({ phone, proof }: { phone: string; proof: string }) {
  const [rawExpiresAt, signature] = proof.split(".");
  const expiresAt = Number(rawExpiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) {
    return false;
  }

  const expected = signSignupProofPayload(`${phone}:${expiresAt}`);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

async function ensureCanSendOtp({
  phone,
  purpose,
  scope,
}: {
  phone: string;
  purpose: OtpPurpose;
  scope: string;
}) {
  const limited = await checkRateLimit({
    scope,
    identifier: phone,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) return { ok: false as const, error: limited.error, resendDelaySeconds: 0 };

  const resendDelaySeconds = await getOtpResendDelaySeconds({ phone, purpose });
  if (resendDelaySeconds > 0) {
    return {
      ok: false as const,
      error: `کد قبلی هنوز معتبر است. ${resendDelaySeconds} ثانیه دیگر برای ارسال کد جدید صبر کنید.`,
      resendDelaySeconds,
    };
  }

  return { ok: true as const };
}

async function createUserWithPhonePassword(phone: string, password: string) {
  const passwordHash = await hashPassword(password);
  const vertical = await getCurrentVertical();

  return db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        phone,
        passwordHash,
        role: "USER",
        credits: 0,
        verticalCreditBalances: {
          create: {
            vertical,
            credits: INITIAL_SIGNUP_CREDITS,
          },
        },
      },
    });

    await tx.creditEvent.create({
      data: {
        userId: created.id,
        vertical,
        delta: INITIAL_SIGNUP_CREDITS,
        balanceBefore: 0,
        balanceAfter: INITIAL_SIGNUP_CREDITS,
        reason: "اعتبار رایگان ثبت‌نام",
        source: "SIGNUP",
      },
    });

    await tx.user.update({
      where: { id: created.id },
      data: { referralCode: referralCodeFromUserId(created.id) },
    });

    return created;
  });
}

export async function sendSignupOtpAction(
  _prevState: OtpFormState,
  formData: FormData,
): Promise<OtpFormState> {
  const phone = normalizeFormPhone(formData.get("phone"));
  if (!phone) return { step: "phone", error: INVALID_PHONE_ERROR };

  const existing = await db.user.findUnique({ where: { phone }, select: { id: true } });
  if (existing) return { step: "phone", phone, error: DUPLICATE_ACCOUNT_ERROR };

  const canSend = await ensureCanSendOtp({ phone, purpose: "SIGNUP", scope: "auth:otp:signup:send" });
  if (!canSend.ok) return { step: "verify", phone, error: canSend.error, resendDelaySeconds: canSend.resendDelaySeconds };

  try {
    await createOtpChallenge({ phone, purpose: "SIGNUP" });
  } catch (error) {
    return { step: "phone", phone, error: friendlySmsError(error) };
  }

  return { step: "verify", phone, message: OTP_SENT_MESSAGE, resendDelaySeconds: 60 };
}

export async function completeSignupAction(
  _prevState: OtpFormState,
  formData: FormData,
): Promise<OtpFormState> {
  const phone = normalizeFormPhone(formData.get("phone"));
  const password = String(formData.get("password") ?? "");
  const signupProof = String(formData.get("signupProof") ?? "");

  if (!phone) return { step: "phone", error: INVALID_PHONE_ERROR };

  if (signupProof) {
    if (!verifySignupProof({ phone, proof: signupProof })) {
      return { step: "verify", phone, error: "اعتبار تایید موبایل تمام شده است. دوباره کد بگیرید." };
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return { step: "password", phone, signupProof, error: PASSWORD_LENGTH_ERROR };
    }

    const existing = await db.user.findUnique({ where: { phone }, select: { id: true } });
    if (existing) return { step: "phone", phone, error: DUPLICATE_ACCOUNT_ERROR };

    const user = await createUserWithPhonePassword(phone, password);

    await createSession({ userId: user.id, role: user.role });
    redirect(postLoginPathForRole(user.role));
  }

  const limited = await checkRateLimit({
    scope: "auth:otp:signup:verify",
    identifier: phone,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) return { step: "verify", phone, error: limited.error };

  const existing = await db.user.findUnique({ where: { phone }, select: { id: true } });
  if (existing) return { step: "phone", phone, error: DUPLICATE_ACCOUNT_ERROR };

  const otp = await verifyOtpChallenge({ phone, purpose: "SIGNUP", code: formData.get("code") });
  if (!otp.ok) return { step: "verify", phone, error: otp.error };

  return {
    step: "password",
    phone,
    signupProof: createSignupProof(phone),
    message: "شماره موبایل تایید شد. حالا رمز عبور را وارد کنید.",
  };
}

export async function sendPasswordResetOtpAction(
  _prevState: OtpFormState,
  formData: FormData,
): Promise<OtpFormState> {
  const phone = normalizeFormPhone(formData.get("phone"));
  if (!phone) return { step: "phone", error: INVALID_PHONE_ERROR };

  const user = await db.user.findUnique({ where: { phone }, select: { id: true } });
  if (!user) return { step: "phone", phone, error: "حسابی با این شماره پیدا نشد." };

  const canSend = await ensureCanSendOtp({ phone, purpose: "PASSWORD_RESET", scope: "auth:otp:password-reset:send" });
  if (!canSend.ok) return { step: "verify", phone, error: canSend.error, resendDelaySeconds: canSend.resendDelaySeconds };

  try {
    await createOtpChallenge({ phone, purpose: "PASSWORD_RESET" });
  } catch (error) {
    return { step: "phone", phone, error: friendlySmsError(error) };
  }

  return { step: "verify", phone, message: OTP_SENT_MESSAGE, resendDelaySeconds: 60 };
}

export async function resetPasswordWithOtpAction(
  _prevState: OtpFormState,
  formData: FormData,
): Promise<OtpFormState> {
  const phone = normalizeFormPhone(formData.get("phone"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!phone) return { step: "phone", error: INVALID_PHONE_ERROR };
  if (password.length < PASSWORD_MIN_LENGTH) return { step: "verify", phone, error: PASSWORD_LENGTH_ERROR };
  if (password !== confirmPassword) return { step: "verify", phone, error: PASSWORD_CONFIRM_ERROR };

  const limited = await checkRateLimit({
    scope: "auth:otp:password-reset:verify",
    identifier: phone,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) return { step: "verify", phone, error: limited.error };

  const otp = await verifyOtpChallenge({ phone, purpose: "PASSWORD_RESET", code: formData.get("code") });
  if (!otp.ok) return { step: "verify", phone, error: otp.error };

  const existing = await db.user.findUnique({ where: { phone }, select: { id: true, role: true } });
  if (!existing) return { step: "phone", phone, error: "حسابی با این شماره پیدا نشد." };

  const user = await db.user.update({
    where: { id: existing.id },
    data: {
      passwordHash: await hashPassword(password),
      sessionVersion: { increment: 1 },
    },
    select: { id: true, role: true },
  });

  await createSession({ userId: user.id, role: user.role });
  redirect(postLoginPathForRole(user.role));
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const identifier = normalizeLoginIdentifier(formData.get("loginIdentifier"));
  const password = String(formData.get("password") ?? "");

  if (!identifier) {
    return { error: BAD_LOGIN_ERROR };
  }

  const limited = await checkRateLimit({
    scope: "auth:login",
    identifier: identifier.value,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return { error: limited.error };
  }

  const user = await db.user.findFirst({
    where: identifier.kind === "email" ? { email: identifier.value } : { phone: identifier.value },
  });
  if (!user) {
    return { error: BAD_LOGIN_ERROR };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: BAD_LOGIN_ERROR };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect(postLoginPathForRole(user.role));
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
