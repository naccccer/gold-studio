"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { getStylePreset } from "@/features/projects/presets";
import { saveGeneratedImage, saveUploadedFile } from "@/lib/uploads";
import { generateStyledImageWithGemini } from "@/lib/ai/gemini";

export type ProjectFormState = {
  error?: string;
};

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await requireUserSession();

  const title = String(formData.get("title") ?? "").trim();
  const stylePresetId = String(formData.get("stylePreset") ?? "");
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return { error: "لطفا تصویر محصول را انتخاب کنید." };
  }

  const stylePreset = getStylePreset(stylePresetId);
  if (!stylePreset) {
    return { error: "سبک انتخاب شده معتبر نیست." };
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { error: "کاربر یافت نشد. دوباره وارد شوید." };
  }

  if (user.credits < 1) {
    return { error: "اعتبار شما کافی نیست. با پشتیبانی تماس بگیرید." };
  }

  const uploaded = await saveUploadedFile(image);

  const project = await db.project.create({
    data: {
      userId: session.userId,
      title: title || null,
      sourceImageUrl: uploaded.publicUrl,
      stylePreset: stylePreset.id,
      prompt: stylePreset.prompt,
      status: "PENDING",
    },
  });

  try {
    const generatedBuffer = await generateStyledImageWithGemini({
      sourceBuffer: uploaded.buffer,
      mimeType: uploaded.mimeType,
      stylePrompt: stylePreset.prompt,
    });

    const resultImageUrl = await saveGeneratedImage(generatedBuffer);

    await db.$transaction([
      db.project.update({
        where: { id: project.id },
        data: { status: "COMPLETED", resultImageUrl, errorMessage: null },
      }),
      db.user.update({
        where: { id: session.userId },
        data: { credits: { decrement: 1 } },
      }),
    ]);
  } catch (error) {
    await db.project.update({
      where: { id: project.id },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "خطا در تولید تصویر با Gemini رخ داد.",
      },
    });
  }

  redirect(`/projects/${project.id}`);
}
