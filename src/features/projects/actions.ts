"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { getStylePreset } from "@/features/projects/presets";
import { saveGeneratedImage, saveTextPromptSourceImage, saveUploadedFile } from "@/lib/uploads";
import { generateStyledImageWithGapGpt, generateTextImageWithGapGpt } from "@/lib/ai/gapgpt";

export type ProjectFormState = {
  error?: string;
};

async function getReadyUser(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { error: "کاربر یافت نشد. دوباره وارد شوید." };
  }

  if (user.credits < 1) {
    return { error: "اعتبار شما کافی نیست. با پشتیبانی تماس بگیرید." };
  }

  return { user };
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await requireUserSession();

  const title = String(formData.get("title") ?? "").trim();
  const mode = String(formData.get("generationMode") ?? "image");
  const stylePresetId = String(formData.get("stylePreset") ?? "");
  const stylePreset = getStylePreset(stylePresetId);

  if (!stylePreset) {
    return { error: "سبک انتخاب شده معتبر نیست." };
  }

  const readyUser = await getReadyUser(session.userId);
  if ("error" in readyUser) {
    return readyUser;
  }

  if (mode === "text") {
    const textPrompt = String(formData.get("textPrompt") ?? "").trim();
    if (textPrompt.length < 3) {
      return { error: "برای تست متن به تصویر، یک پرامپت کوتاه وارد کنید." };
    }

    const sourceImageUrl = await saveTextPromptSourceImage(textPrompt);
    const project = await db.project.create({
      data: {
        userId: session.userId,
        title: title || "تست متن به تصویر",
        sourceImageUrl,
        stylePreset: stylePreset.id,
        prompt: `${textPrompt}\n\n${stylePreset.prompt}`,
        status: "PENDING",
      },
    });

    try {
      const generatedImage = await generateTextImageWithGapGpt({
        prompt: textPrompt,
        stylePrompt: stylePreset.prompt,
      });
      const resultImageUrl = await saveGeneratedImage(generatedImage.imageBuffer);

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
          errorMessage: error instanceof Error ? error.message : "خطا در تست متن به تصویر با GapGPT رخ داد.",
        },
      });
    }

    redirect(`/projects/${project.id}`);
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { error: "لطفا تصویر محصول را انتخاب کنید." };
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
    const generatedImage = await generateStyledImageWithGapGpt({
      sourceBuffer: uploaded.buffer,
      mimeType: uploaded.mimeType,
      stylePrompt: stylePreset.prompt,
    });
    const resultImageUrl = await saveGeneratedImage(generatedImage.imageBuffer);

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
        errorMessage: error instanceof Error ? error.message : "خطا در تولید تصویر با GapGPT رخ داد.",
      },
    });
  }

  redirect(`/projects/${project.id}`);
}
