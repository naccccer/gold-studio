"use server";

import { redirect } from "next/navigation";
import { normalizeLoginIdentifier } from "@/lib/auth/identifier";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSession, createSession } from "@/lib/auth/session";
import { INITIAL_SIGNUP_CREDITS } from "@/lib/credits";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { referralCodeFromUserId } from "@/lib/referrals";

export type AuthFormState = {
  error?: string;
};

const PASSWORD_MIN_LENGTH = 6;
const INVALID_IDENTIFIER_ERROR = "ایمیل یا موبایل را درست وارد کنید.";
const DUPLICATE_ACCOUNT_ERROR = "این حساب قبلا ساخته شده.";
const BAD_LOGIN_ERROR = "اطلاعات ورود درست نیست.";

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const identifier = normalizeLoginIdentifier(formData.get("loginIdentifier"));
  const password = String(formData.get("password") ?? "");

  if (!identifier) {
    return { error: INVALID_IDENTIFIER_ERROR };
  }

  const limited = await checkRateLimit({
    scope: "auth:signup",
    identifier: identifier.value,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return { error: limited.error };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { error: "رمز عبور حداقل ۶ کاراکتر باشد." };
  }

  const existing = await db.user.findFirst({
    where: identifier.kind === "email" ? { email: identifier.value } : { phone: identifier.value },
  });
  if (existing) {
    return { error: DUPLICATE_ACCOUNT_ERROR };
  }

  const passwordHash = await hashPassword(password);
  const email = identifier.kind === "email" ? identifier.value : null;
  const phone = identifier.kind === "phone" ? identifier.value : null;

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role: "USER",
        credits: INITIAL_SIGNUP_CREDITS,
      },
    });

    await tx.creditEvent.create({
      data: {
        userId: created.id,
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

  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
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
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
