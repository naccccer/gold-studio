"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { getStyleForGeneration } from "@/lib/styles";
import { readStoredUpload, saveGeneratedImage, saveTextPromptSourceImage, saveUploadedFile } from "@/lib/uploads";
import { generateStyledImageWithGapGpt, generateTextImageWithGapGpt } from "@/lib/ai/gapgpt";

export type ProjectFormState = {
  error?: string;
};

async function getReadyUser(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { error: "کاربر یافت نشد. دوباره وارد شوید." };
  }

  return { user };
}

function buildPrompt(basePrompt: string, formData: FormData) {
  const outputPreset = String(formData.get("outputPreset") ?? "post");
  const modelGender = String(formData.get("modelGender") ?? "");
  const modesty = String(formData.get("modesty") ?? "");
  const promptParts = [basePrompt, `Output preset: ${outputPreset}.`];

  if (modelGender) {
    promptParts.push(`Optional model gender preference: ${modelGender}.`);
  }

  if (modesty) {
    promptParts.push(`Modesty and refinement level: ${modesty}/100.`);
  }

  return promptParts.join("\n");
}

async function completeImageProject({
  projectId,
  sourceBuffer,
  mimeType,
  stylePrompt,
}: {
  projectId: string;
  sourceBuffer: Buffer;
  mimeType: string;
  stylePrompt: string;
}) {
  try {
    const generatedImage = await generateStyledImageWithGapGpt({
      sourceBuffer,
      mimeType,
      stylePrompt,
    });
    const resultImageUrl = await saveGeneratedImage(generatedImage.imageBuffer);

    await db.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED", resultImageUrl, errorMessage: null },
    });
  } catch (error) {
    await db.project.update({
      where: { id: projectId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "خطا در تولید تصویر با GapGPT رخ داد.",
      },
    });
  }
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await requireUserSession();

  const title = String(formData.get("title") ?? "").trim();
  const mode = String(formData.get("generationMode") ?? "image");
  const sourceAssetId = String(formData.get("sourceAssetId") ?? "").trim();
  const stylePresetId = String(formData.get("stylePreset") ?? "");
  const stylePreset = await getStyleForGeneration(stylePresetId);

  if (!stylePreset) {
    return { error: "سبک انتخاب‌شده معتبر نیست." };
  }

  const readyUser = await getReadyUser(session.userId);
  if ("error" in readyUser) {
    return readyUser;
  }

  const stylePrompt = buildPrompt(stylePreset.prompt, formData);

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
        stylePreset: stylePreset.preset,
        prompt: `${textPrompt}\n\n${stylePrompt}`,
        status: "PENDING",
      },
    });

    try {
      const generatedImage = await generateTextImageWithGapGpt({
        prompt: textPrompt,
        stylePrompt,
      });
      const resultImageUrl = await saveGeneratedImage(generatedImage.imageBuffer);

      await db.project.update({
        where: { id: project.id },
        data: { status: "COMPLETED", resultImageUrl, errorMessage: null },
      });
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

  if (sourceAssetId) {
    const asset = await db.productAsset.findFirst({
      where: { id: sourceAssetId, userId: session.userId, status: "READY" },
    });

    if (!asset) {
      return { error: "تصویر گالری یافت نشد." };
    }

    const source = await readStoredUpload(asset.storageKey, asset.mimeType);
    const project = await db.project.create({
      data: {
        userId: session.userId,
        sourceAssetId: asset.id,
        title: title || asset.title || asset.originalName || null,
        sourceImageUrl: asset.fileUrl,
        stylePreset: stylePreset.preset,
        prompt: stylePrompt,
        status: "PENDING",
      },
    });

    await completeImageProject({
      projectId: project.id,
      sourceBuffer: source.buffer,
      mimeType: source.mimeType,
      stylePrompt,
    });

    redirect(`/projects/${project.id}`);
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { error: "لطفا تصویر محصول را انتخاب کنید." };
  }

  const uploaded = await saveUploadedFile(image);
  const asset = await db.productAsset.create({
    data: {
      userId: session.userId,
      fileUrl: uploaded.publicUrl,
      storageKey: uploaded.storageKey,
      mimeType: uploaded.mimeType,
      originalName: uploaded.originalName,
      title: title || uploaded.originalName,
    },
  });

  const project = await db.project.create({
    data: {
      userId: session.userId,
      sourceAssetId: asset.id,
      title: title || null,
      sourceImageUrl: uploaded.publicUrl,
      stylePreset: stylePreset.preset,
      prompt: stylePrompt,
      status: "PENDING",
    },
  });

  await completeImageProject({
    projectId: project.id,
    sourceBuffer: uploaded.buffer,
    mimeType: uploaded.mimeType,
    stylePrompt,
  });

  redirect(`/projects/${project.id}`);
}
