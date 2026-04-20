"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function loginWithCredentials(
  _previousState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return "ایمیل و رمز عبور الزامی است.";
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/auth/redirect",
    });

    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return "ایمیل یا رمز عبور صحیح نیست.";
      }

      return "ورود انجام نشد. دوباره تلاش کنید.";
    }

    throw error;
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
