"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSession, createSession } from "@/lib/auth/session";

export type AuthFormState = {
  error?: string;
};

function validateEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!validateEmail(email)) {
    return { error: "ایمیل معتبر وارد کنید." };
  }

  if (password.length < 8) {
    return { error: "رمز عبور باید حداقل ۸ کاراکتر باشد." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "این ایمیل قبلا ثبت شده است." };
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
      role: adminEmail && adminEmail === email ? "ADMIN" : "USER",
    },
  });

  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "اطلاعات ورود نادرست است." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "اطلاعات ورود نادرست است." };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
