"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { processImageProject, processTextProject } from "@/lib/generation/jobs";
import { getStyleForGeneration } from "@/lib/styles";
import { saveTextPromptSourceImage, saveUploadedFile } from "@/lib/uploads";

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

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await requireUserSession();

  const title = String(formData.get("title") ?? "").trim();
  const mode = String(formData.get("generationMode") ?? "image");
  const sourceAssetId = String(formData.get("sourceAssetId") ?? "").trim();
  const styleId = String(formData.get("styleId") ?? "");
  const style = await getStyleForGeneration(styleId);

  if (!style) {
    return { error: "سبک انتخاب‌شده معتبر نیست." };
  }

  const readyUser = await getReadyUser(session.userId);
  if ("error" in readyUser) {
    return readyUser;
  }

  const stylePrompt = buildPrompt(style.prompt, formData);

  if (mode === "text") {
    if (session.role !== "ADMIN") {
      return { error: "این قابلیت فقط در بخش ادمین در دسترس است." };
    }

    const textPrompt = String(formData.get("textPrompt") ?? "").trim();
    if (textPrompt.length < 3) {
      return { error: "برای اجرای تست داخلی، یک ورودی کوتاه ثبت کنید." };
    }

    const sourceImageUrl = await saveTextPromptSourceImage(textPrompt);
    const project = await db.project.create({
      data: {
        userId: session.userId,
        title: title || "تست داخلی متن به تصویر",
        sourceImageUrl,
        styleId: style.id,
        prompt: `${textPrompt}\n\n${stylePrompt}`,
        status: "QUEUED",
      },
    });

    after(() => processTextProject({ projectId: project.id, textPrompt, stylePrompt }));
    redirect(`/projects/${project.id}`);
  }

  if (sourceAssetId) {
    const asset = await db.productAsset.findFirst({
      where: { id: sourceAssetId, userId: session.userId, status: "READY" },
    });

    if (!asset) {
      return { error: "تصویر گالری یافت نشد." };
    }

    const project = await db.project.create({
      data: {
        userId: session.userId,
        sourceAssetId: asset.id,
        title: title || asset.title || asset.originalName || null,
        sourceImageUrl: asset.fileUrl,
        styleId: style.id,
        prompt: stylePrompt,
        status: "QUEUED",
      },
    });

    after(() => processImageProject(project.id));
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
      styleId: style.id,
      prompt: stylePrompt,
      status: "QUEUED",
    },
  });

  after(() => processImageProject(project.id));
  redirect(`/projects/${project.id}`);
}
