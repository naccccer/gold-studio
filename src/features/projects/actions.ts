"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { processImageProject, processTextProject } from "@/lib/generation/jobs";
import { getStyleForGeneration, type StyleForGeneration } from "@/lib/styles";
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

const outputPresetInstructions: Record<string, string> = {
  post: "Output format: square product image for catalog and social post use. Keep generous clean space around the product.",
  story: "Output format: vertical story image. Keep the product fully visible and avoid cropping important details.",
  banner: "Output format: horizontal banner image. Keep the product prominent with refined negative space.",
};

const modelGenderInstructions: Record<string, string> = {
  woman: "Use an elegant adult woman model when a human model is needed.",
  man: "Use an elegant adult man model when a human model is needed.",
};

function hasHumanModelControls(style: StyleForGeneration) {
  return style.controls?.some((control) => control.key === "modelGender" || control.key === "modesty") ?? false;
}

function getModestyInstruction(value: number) {
  if (value <= 0) {
    return "Modesty styling: no hijab or religious head covering is required. Keep the image elegant, tasteful, non-sexual, adult, and product-first.";
  }

  if (value <= 30) {
    return "Modesty styling: low coverage preference. No hijab requirement; use refined contemporary styling, tasteful wardrobe, and no sexualized posing.";
  }

  if (value <= 65) {
    return "Modesty styling: moderate coverage preference. Use elegant covered styling or a light head covering only if it fits the composition naturally.";
  }

  return "Modesty styling: high coverage preference. Use conservative elegant wardrobe, covered hair when appropriate, and refined fashion-editorial styling without costume-like exaggeration.";
}

function normalizeModesty(value: number) {
  if (!Number.isFinite(value)) {
    return 65;
  }

  return Math.min(90, Math.max(0, value));
}

function buildPrompt(style: StyleForGeneration, formData: FormData) {
  const outputPreset = String(formData.get("outputPreset") ?? "post");
  const modelGender = String(formData.get("modelGender") ?? "");
  const modestyValue = Number.parseInt(String(formData.get("modesty") ?? "65"), 10);
  const promptParts = [style.prompt, outputPresetInstructions[outputPreset] ?? outputPresetInstructions.post];
  const includesHumanModel = hasHumanModelControls(style);

  if (includesHumanModel) {
    const modelGenderInstruction = modelGenderInstructions[modelGender];
    if (modelGenderInstruction) {
      promptParts.push(modelGenderInstruction);
    }

    promptParts.push(getModestyInstruction(normalizeModesty(modestyValue)));
    promptParts.push(
      "Human realism: preserve natural skin texture, visible pores, subtle fine lines, realistic hands, neck, ears, and skin tone variation. Avoid waxy, porcelain, airbrushed, plastic, doll-like, or AI-smoothed skin.",
    );
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

  const stylePrompt = buildPrompt(style, formData);

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
      where: { id: sourceAssetId, userId: session.userId, status: "READY", archivedAt: null },
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

  const image = formData.getAll("image").find((value): value is File => value instanceof File && value.size > 0);
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

export async function renameProjectAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!projectId || title.length === 0 || title.length > 80) {
    return;
  }

  await db.project.updateMany({
    where: { id: projectId, userId: session.userId, archivedAt: null },
    data: { title },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function archiveProjectAction(formData: FormData) {
  const session = await requireUserSession();
  const projectIds = formData.getAll("projectId").map(String).map((id) => id.trim()).filter(Boolean);

  if (projectIds.length === 0) {
    return;
  }

  await db.project.updateMany({
    where: { id: { in: projectIds }, userId: session.userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function retryProjectAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.userId, status: "FAILED", archivedAt: null },
    select: { id: true, sourceAssetId: true },
  });

  if (!project?.sourceAssetId) {
    return;
  }

  const updated = await db.project.updateMany({
    where: { id: project.id, userId: session.userId, status: "FAILED", archivedAt: null },
    data: { status: "QUEUED", errorMessage: null, resultImageUrl: null, resultStorageKey: null },
  });

  if (updated.count === 0) {
    return;
  }

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/projects");
  after(() => processImageProject(project.id));
  redirect(`/projects/${project.id}`);
}
