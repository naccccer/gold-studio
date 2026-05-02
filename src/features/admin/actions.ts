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

export async function updateCreativeStyleAction(formData: FormData) {
  await requireAdminSession();

  const styleId = String(formData.get("styleId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const previewImageUrl = String(formData.get("previewImageUrl") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!styleId || !name || !description || !prompt || !previewImageUrl || Number.isNaN(sortOrder)) {
    return;
  }

  await db.creativeStyle.update({
    where: { id: styleId },
    data: {
      name,
      description,
      prompt,
      previewImageUrl,
      sortOrder: Math.floor(sortOrder),
      isActive: formData.has("isActive"),
      isUserVisible: formData.has("isUserVisible"),
    },
  });

  revalidatePath("/admin/styles");
  revalidatePath("/projects/new");
  revalidatePath("/gallery");
}

export async function createCreativeStyleAction(formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const previewImageUrl = String(formData.get("previewImageUrl") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!name || !description || !prompt || !previewImageUrl || Number.isNaN(sortOrder)) {
    return;
  }

  await db.creativeStyle.create({
    data: {
      name,
      description,
      prompt,
      previewImageUrl,
      sortOrder: Math.floor(sortOrder),
      isActive: formData.has("isActive"),
      isUserVisible: formData.has("isUserVisible"),
    },
  });

  revalidatePath("/admin/styles");
  revalidatePath("/projects/new");
  revalidatePath("/gallery");
}
