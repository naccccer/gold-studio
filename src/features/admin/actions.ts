"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";

export async function updateUserCreditsAction(formData: FormData) {
  await requireAdminSession();

  const userId = String(formData.get("userId") ?? "");
  const credits = Number(formData.get("credits") ?? 0);

  if (!userId || Number.isNaN(credits) || credits < 0) {
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: { credits: Math.floor(credits) },
  });

  revalidatePath("/admin");
}
