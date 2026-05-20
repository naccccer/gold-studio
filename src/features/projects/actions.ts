"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { buildStyleControlPrompt, hasHumanModelStyleControls } from "@/lib/ai/style-controls";
import { buildVisionPromptContext } from "@/lib/ai/vision";
import { requireUserSession } from "@/lib/auth/session";
import {
  attachGenerationCreditReservation,
  releaseGenerationCreditReservation,
  reserveGenerationCredit,
} from "@/lib/billing";
import { processImageProject, processTextProject } from "@/lib/generation/jobs";
import { getOutputPresetSpec, normalizeOutputPreset } from "@/lib/output-presets";
import { pickVisionTitle, retryProjectVisionTitle } from "@/lib/product-vision";
import { isProductType } from "@/lib/product-types";
import { readStorageObject } from "@/lib/storage";
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

async function reserveCreditOrState(userId: string) {
  const reservation = await reserveGenerationCredit({ userId });
  if (!reservation.ok) {
    return { ok: false as const, error: reservation.error };
  }

  return { ok: true as const, reservationId: reservation.reservationId };
}

function getCompositionInstruction(productType?: string | null, visionAngle?: string | null) {
  const isWatch = productType === "ساعت";
  const isWorn = visionAngle === "worn";

  const instructions = [
    "Composition: keep the product clearly prominent and easy to inspect in frame.",
    "Favor a balanced close composition where the product usually occupies roughly one-third to three-fifths of the frame.",
    "Do not use an extreme tight crop, and do not leave the product as a small secondary element inside wide empty space.",
  ];

  if (isWatch && isWorn) {
    instructions.push(
      "For a worn watch, keep a natural amount of wrist and skin visible, but frame closely enough that the watch remains the obvious hero of the image.",
    );
  }

  return instructions.join("\n");
}

function getFineDetailInstruction(productType?: string | null) {
  if (productType === "ساعت") {
    return [
      "Fine detail priority: preserve the watch face layout, display structure, bezel markings, button placement, engravings, and case edges.",
      "Keep small functional details crisp and believable; do not blur, simplify, repaint, or replace them with generic shapes.",
    ].join("\n");
  }

  return [
    "Fine detail priority: preserve engravings, edges, stone settings, clasp details, and other small visible design cues.",
    "Do not blur, simplify, repaint, or replace small product details with generic shapes.",
  ].join("\n");
}

function buildPrompt(
  style: StyleForGeneration,
  formData: FormData,
  vision?: {
    productType?: string | null;
    visionDescription?: string | null;
    visionConfidence?: number | null;
    visionAngle?: string | null;
  } | null,
) {
  const outputPreset = normalizeOutputPreset(formData.get("outputPreset"));
  const promptParts = [style.prompt, getOutputPresetSpec(outputPreset).instruction];
  const visionContext = vision ? buildVisionPromptContext(vision) : "";
  const styleControlPrompt = buildStyleControlPrompt(style, formData);
  const includesHumanModel = hasHumanModelStyleControls(style);
  const submittedProductType = String(formData.get("productType") ?? "").trim();
  const productType = vision?.productType ?? (submittedProductType || null);

  if (includesHumanModel) {
    promptParts.push(
      "Model age and casting: if a human model appears, use a believable young adult model, generally 25 to 35 years old. Avoid elderly, childlike, teen, overly aged, tired, or heavily wrinkled faces and hands.",
    );
    promptParts.push(
      "Human realism: preserve natural skin texture, visible pores, subtle fine lines, realistic hands, neck, ears, and skin tone variation. Avoid waxy, porcelain, airbrushed, plastic, doll-like, or AI-smoothed skin.",
    );
  }

  if (styleControlPrompt) {
    promptParts.push(styleControlPrompt);
  }

  promptParts.push(getCompositionInstruction(productType, vision?.visionAngle));
  promptParts.push(getFineDetailInstruction(productType));

  if (visionContext) {
    promptParts.push(visionContext);
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
  const submittedProductType = String(formData.get("productType") ?? "").trim();
  const selectedProductType = isProductType(submittedProductType) ? submittedProductType : "محصول";
  const outputPreset = normalizeOutputPreset(formData.get("outputPreset"));
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

    const reserved = await reserveCreditOrState(session.userId);
    if (!reserved.ok) {
      return { error: reserved.error };
    }

    let project: { id: string };
    try {
      const sourceImageUrl = await saveTextPromptSourceImage(textPrompt);
      project = await db.project.create({
      data: {
        userId: session.userId,
        title: title || "تست داخلی متن به تصویر",
        sourceImageUrl,
        outputPreset,
        styleId: style.id,
        prompt: `${textPrompt}\n\n${stylePrompt}`,
        status: "QUEUED",
      },
        select: { id: true },
      });
      await attachGenerationCreditReservation({ reservationId: reserved.reservationId, projectId: project.id });
    } catch (error) {
      await releaseGenerationCreditReservation({ reservationId: reserved.reservationId });
      throw error;
    }

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

    const reserved = await reserveCreditOrState(session.userId);
    if (!reserved.ok) {
      return { error: reserved.error };
    }

    let project: { id: string };
    try {
    if (asset.productType !== selectedProductType) {
      await db.productAsset.updateMany({
        where: { id: asset.id, userId: session.userId, status: "READY", archivedAt: null },
        data: { productType: selectedProductType },
      });
    }

    const projectPrompt = buildPrompt(style, formData, {
      productType: selectedProductType,
      visionDescription: asset.visionDescription,
      visionConfidence: asset.visionConfidence,
      visionAngle: asset.visionAngle,
    });
    project = await db.project.create({
      data: {
        userId: session.userId,
        sourceAssetId: asset.id,
        title: pickVisionTitle({
          userTitle: title,
          visionShortTitle: asset.visionShortTitle,
          fallbackTitle: asset.title || asset.originalName,
        }),
        sourceImageUrl: asset.fileUrl,
        outputPreset,
        styleId: style.id,
        prompt: projectPrompt,
        status: "QUEUED",
      },
      select: { id: true },
    });
    await attachGenerationCreditReservation({ reservationId: reserved.reservationId, projectId: project.id });
    } catch (error) {
      await releaseGenerationCreditReservation({ reservationId: reserved.reservationId });
      throw error;
    }

    if (!asset.visionAnalyzedAt) {
      after(() => retryProjectVisionTitle(project.id, session.userId, { forceAnalyze: true }));
    }
    after(() => processImageProject(project.id));
    redirect(`/projects/${project.id}`);
  }

  const image = formData.getAll("image").find((value): value is File => value instanceof File && value.size > 0);
  if (!(image instanceof File) || image.size === 0) {
    return { error: "لطفا تصویر محصول را انتخاب کنید." };
  }

  const reserved = await reserveCreditOrState(session.userId);
  if (!reserved.ok) {
    return { error: reserved.error };
  }

  let asset: { id: string };
  let project: { id: string };
  try {
    const uploaded = await saveUploadedFile(image);
    asset = await db.productAsset.create({
      data: {
        userId: session.userId,
        fileUrl: uploaded.publicUrl,
        storageKey: uploaded.storageKey,
        mimeType: uploaded.mimeType,
        originalName: uploaded.originalName,
        title: title || null,
        productType: selectedProductType,
      },
      select: { id: true },
    });
    const projectPrompt = buildPrompt(style, formData, {
      productType: selectedProductType,
      visionDescription: null,
      visionConfidence: null,
      visionAngle: null,
    });

    project = await db.project.create({
      data: {
        userId: session.userId,
        sourceAssetId: asset.id,
        title: pickVisionTitle({
          userTitle: title,
          visionShortTitle: null,
          fallbackTitle: uploaded.originalName,
        }),
        sourceImageUrl: uploaded.publicUrl,
        outputPreset,
        styleId: style.id,
        prompt: projectPrompt,
        status: "QUEUED",
      },
      select: { id: true },
    });
    await attachGenerationCreditReservation({ reservationId: reserved.reservationId, projectId: project.id });
  } catch (error) {
    await releaseGenerationCreditReservation({ reservationId: reserved.reservationId });
    throw error;
  }

  after(async () => {
    await retryProjectVisionTitle(project.id, session.userId, { forceAnalyze: true });
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

export async function updateProjectProductTypeAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const productType = String(formData.get("productType") ?? "").trim();

  if (!projectId || !isProductType(productType)) {
    return;
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.userId, archivedAt: null },
    select: { sourceAssetId: true },
  });

  if (!project?.sourceAssetId) {
    return;
  }

  await db.productAsset.updateMany({
    where: { id: project.sourceAssetId, userId: session.userId, status: "READY", archivedAt: null },
    data: { productType },
  });

  revalidatePath("/gallery");
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

export async function createFreeProjectVariantAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  const variantId = randomUUID();
  const variant = await db.$transaction(async (tx) => {
    const parent = await tx.project.findFirst({
      where: {
        id: projectId,
        userId: session.userId,
        status: "COMPLETED",
        archivedAt: null,
        variantParentId: null,
      },
      select: {
        id: true,
        userId: true,
        sourceAssetId: true,
        title: true,
        sourceImageUrl: true,
        outputPreset: true,
        styleId: true,
        prompt: true,
        freeVariantUsedAt: true,
        freeVariantProjectId: true,
      },
    });

    if (!parent?.sourceAssetId || parent.freeVariantUsedAt || parent.freeVariantProjectId) {
      return null;
    }

    const claimed = await tx.project.updateMany({
      where: {
        id: parent.id,
        userId: session.userId,
        status: "COMPLETED",
        archivedAt: null,
        variantParentId: null,
        freeVariantUsedAt: null,
        freeVariantProjectId: null,
      },
      data: { freeVariantProjectId: variantId },
    });

    if (claimed.count === 0) {
      return null;
    }

    return tx.project.create({
      data: {
        id: variantId,
        userId: parent.userId,
        sourceAssetId: parent.sourceAssetId,
        title: parent.title ? `${parent.title} - نسخه دیگر` : "نسخه دیگر",
        sourceImageUrl: parent.sourceImageUrl,
        outputPreset: parent.outputPreset,
        styleId: parent.styleId,
        prompt: parent.prompt,
        status: "QUEUED",
        variantParentId: parent.id,
      },
      select: { id: true },
    });
  });

  if (!variant) {
    revalidatePath(`/projects/${projectId}`);
    return;
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  after(() => processImageProject(variant.id));
  redirect(`/projects/${variant.id}`);
}

export async function retryProjectAction(formData: FormData) {
  const session = await requireUserSession();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.userId, status: { in: ["FAILED", "COMPLETED"] }, archivedAt: null },
    select: { id: true, sourceAssetId: true, status: true, resultImageUrl: true, resultStorageKey: true },
  });

  if (!project?.sourceAssetId) {
    return;
  }

  if (project.status === "COMPLETED") {
    if (!project.resultStorageKey && project.resultImageUrl) {
      return;
    }

    if (project.resultStorageKey) {
      try {
        await readStorageObject(project.resultStorageKey, "application/octet-stream");
        return;
      } catch (error) {
        console.error("[retry-missing-completed-result]", {
          projectId: project.id,
          resultStorageKey: project.resultStorageKey,
          error,
        });
      }
    }
  }

  const reservation = await reserveGenerationCredit({ userId: session.userId, projectId: project.id });
  if (!reservation.ok) {
    redirect(`/billing?error=${encodeURIComponent(reservation.error)}`);
  }

  const updated = await db.project.updateMany({
    where: { id: project.id, userId: session.userId, status: project.status, archivedAt: null },
    data: { status: "QUEUED", errorMessage: null, resultImageUrl: null, resultStorageKey: null },
  });

  if (updated.count === 0) {
    await releaseGenerationCreditReservation({ reservationId: reservation.reservationId });
    return;
  }

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/projects");
  after(() => processImageProject(project.id));
  redirect(`/projects/${project.id}`);
}
