"use server";

import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import type { Prisma } from "@/generated/prisma";
import sharp from "sharp";
import { db } from "@/lib/db";
import { requireAdminOrSalesSession, requireAdminSession } from "@/lib/auth/session";
import { normalizeProviderSettings, SUPPORTED_IMAGE_MODELS, updateProviderSettings } from "@/lib/ai/provider-settings";
import { normalizeLoginIdentifier } from "@/lib/auth/identifier";
import { hashPassword } from "@/lib/auth/password";
import { getSubscriptionPeriod, logAdminAudit } from "@/lib/billing";
import { normalizeBillingPlanColorPreset } from "@/lib/billing-plan-colors";
import { creditUnitsToVisibleCredits, visibleCreditsToCreditUnits } from "@/lib/credit-units";
import { INITIAL_SIGNUP_CREDITS } from "@/lib/credits";
import { processImageProject } from "@/lib/generation/jobs";
import { createAdminBroadcastNotification, createAdminUserNotification } from "@/lib/notifications";
import { approveQualityReviewWithRefund, rejectQualityReview } from "@/lib/quality-review";
import {
  ensureReadyStyleReferenceSampleDirectory,
  getReadyStyleReferenceSample,
  readyStyleReferenceSampleDirectoryForVertical,
} from "@/lib/ready-style-reference-samples";
import {
  createSalesReferralCodeBatch,
  grantReferralRewardAfterFirstPurchase,
  referralCodeFromUserId,
} from "@/lib/referrals";
import { deleteStorageObject } from "@/lib/storage";
import { saveHomeCarouselFile, saveStylePreviewFile } from "@/lib/uploads";
import { normalizeUserVisibleVerticalId, normalizeVerticalId, type UserVisibleVerticalId } from "@/lib/verticals";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const READY_SAMPLE_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const READY_SAMPLE_MAX_BYTES = 15 * 1024 * 1024;

function slugFromFileName(fileName: string) {
  const stem = path.basename(fileName, path.extname(fileName));
  return stem.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sample";
}

async function normalizeReadySampleImage(file: File) {
  if (file.size > READY_SAMPLE_MAX_BYTES) {
    throw new Error("حجم نمونه آماده باید کمتر از ۱۵ مگابایت باشد.");
  }

  if (file.type && !READY_SAMPLE_ALLOWED_TYPES.has(file.type)) {
    throw new Error("فرمت نمونه آماده باید JPG، PNG یا WEBP باشد.");
  }

  try {
    return await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "none" })
      .rotate()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86, effort: 4 })
      .toBuffer();
  } catch (error) {
    console.error("[ready-style-reference-sample-normalize-failed]", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      error,
    });
    throw new Error("نمونه آماده معتبر نیست یا قابل پردازش نبود.");
  }
}

function integer(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseInt(String(formData.get(key) ?? ""), 10);
  return Number.isFinite(value) ? value : fallback;
}

function optionalInteger(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function parseStyleControlType(value: string) {
  if (value === "RANGE" || value === "BOOLEAN") return value;
  return "CHOICE";
}

function normalizeControlOptions(options: string, type: "CHOICE" | "RANGE" | "BOOLEAN") {
  if (type !== "CHOICE") return null;
  if (!options) return null;

  try {
    const parsed = JSON.parse(options) as unknown;
    if (!Array.isArray(parsed)) return null;

    const clean = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const option = item as { value?: unknown; label?: unknown };
        const value = String(option.value ?? "").trim();
        const label = String(option.label ?? "").trim();
        return value && label ? { value, label } : null;
      })
      .filter((item): item is { value: string; label: string } => Boolean(item));

    return clean.length > 0 ? JSON.stringify(clean) : null;
  } catch {
    return null;
  }
}

async function getStylePreviewImageUrl(formData: FormData, fallback = "") {
  const image = formData.get("previewImage");
  if (image instanceof File && image.size > 0) {
    return (await saveStylePreviewFile(image)).publicUrl;
  }

  return fallback || text(formData, "previewImageUrl");
}

function parseRole(value: string) {
  if (value === "SALES") return "SALES";
  return value === "ADMIN" ? "ADMIN" : "USER";
}

function normalizedOptionalIdentifier(formData: FormData, key: string, expected: "email" | "phone") {
  const raw = text(formData, key);
  if (!raw) return { raw, value: null };

  const normalized = normalizeLoginIdentifier(raw);
  if (normalized?.kind !== expected) {
    return { raw, value: undefined };
  }

  return { raw, value: normalized.value };
}

async function hasDuplicateIdentifier({
  email,
  phone,
  exceptUserId,
}: {
  email?: string | null;
  phone?: string | null;
  exceptUserId?: string;
}) {
  const checks = [
    ...(email ? [{ email }] : []),
    ...(phone ? [{ phone }] : []),
  ];

  if (checks.length === 0) return false;

  const duplicate = await db.user.findFirst({
    where: {
      ...(exceptUserId ? { id: { not: exceptUserId } } : {}),
      OR: checks,
    },
    select: { id: true },
  });

  return Boolean(duplicate);
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/support");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/ai");
  revalidatePath("/admin/styles");
  revalidatePath("/admin/home");
  revalidatePath("/admin/referrals");
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/quality-reviews");
  revalidatePath("/admin/assets/samples");
  revalidatePath("/dashboard");
  revalidatePath("/account");
  revalidatePath("/billing");
}

async function getCarouselImageInput(formData: FormData, fileKey: string, urlKey: string, fallbackUrl = "", fallbackStorageKey: string | null = null) {
  const image = formData.get(fileKey);
  if (image instanceof File && image.size > 0) {
    return await saveHomeCarouselFile(image);
  }

  const url = text(formData, urlKey);
  if (url) {
    return { publicUrl: url, storageKey: null };
  }

  return { publicUrl: fallbackUrl, storageKey: fallbackStorageKey };
}

function homeCarouselAdminPath(vertical: UserVisibleVerticalId, slideId?: string) {
  const params = new URLSearchParams({ vertical });
  if (slideId) {
    params.set("slide", slideId);
  }

  return `/admin/home?${params.toString()}`;
}

function readySamplesAdminPath(vertical: UserVisibleVerticalId, error?: string) {
  const params = new URLSearchParams({ vertical });
  if (error) {
    params.set("error", error);
  }

  return `/admin/assets/samples?${params.toString()}`;
}

export async function uploadReadyStyleReferenceSampleAction(formData: FormData) {
  const session = await requireAdminSession();
  const vertical = normalizeUserVisibleVerticalId(text(formData, "vertical"));
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    redirect(readySamplesAdminPath(vertical));
  }

  try {
    const buffer = await normalizeReadySampleImage(image);
    const fileName = `ready-sample-${slugFromFileName(image.name)}-${randomUUID().slice(0, 8)}.webp`;
    await ensureReadyStyleReferenceSampleDirectory(vertical);
    await writeFile(path.join(readyStyleReferenceSampleDirectoryForVertical(vertical), fileName), buffer, { flag: "wx" });

    await logAdminAudit({
      actorAdminId: session.userId,
      action: "ready_style_reference_sample.upload",
      targetType: "ReadyStyleReferenceSample",
      targetId: fileName,
      summary: "نمونه آماده عمومی آپلود شد.",
      metadata: { fileName, originalName: image.name || null, vertical },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "آپلود نمونه آماده کامل نشد.";
    redirect(readySamplesAdminPath(vertical, message));
  }

  revalidatePath("/admin/assets/samples");
  revalidatePath("/account/style-references");
  redirect(readySamplesAdminPath(vertical));
}

export async function deleteReadyStyleReferenceSampleAction(formData: FormData) {
  const session = await requireAdminSession();
  const sampleId = text(formData, "sampleId");
  const vertical = normalizeUserVisibleVerticalId(text(formData, "vertical"));
  if (!sampleId) {
    return;
  }

  const sample = await getReadyStyleReferenceSample(sampleId, vertical);
  if (!sample) {
    return;
  }

  await unlink(sample.filePath);
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "ready_style_reference_sample.delete",
    targetType: "ReadyStyleReferenceSample",
    targetId: sample.fileName,
    summary: "نمونه آماده عمومی حذف شد.",
    metadata: { fileName: sample.fileName, vertical },
  });

  revalidatePath("/admin/assets/samples");
  revalidatePath("/account/style-references");
  redirect(readySamplesAdminPath(vertical));
}

export async function updateProviderSettingsAction(formData: FormData) {
  const session = await requireAdminSession();
  const imageProvider = text(formData, "imageProvider");
  const activeModel = text(formData, "activeModel");
  const fallbackModels = formData.getAll("fallbackModels").map(String);
  const settings = normalizeProviderSettings({
    imageProvider,
    activeModel,
    fallbackModels,
    autoFallback: formData.has("autoFallback"),
  });

  if (!SUPPORTED_IMAGE_MODELS.includes(settings.activeModel)) {
    return;
  }

  await updateProviderSettings(settings);
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "provider_settings.update",
    targetType: "ProviderSettings",
    targetId: "default",
    summary: "تنظیمات مدل تولید تصویر به‌روزرسانی شد.",
    metadata: {
      imageProvider: settings.imageProvider,
      activeModel: settings.activeModel,
      fallbackModels: settings.fallbackModels,
      autoFallback: settings.autoFallback,
    },
  });
  revalidatePath("/admin/ai");
  redirect("/admin/ai");
}

export async function createHomeCarouselSlideAction(formData: FormData) {
  const session = await requireAdminSession();
  const vertical = normalizeUserVisibleVerticalId(text(formData, "vertical"));
  const before = await getCarouselImageInput(formData, "beforeImage", "beforeImageUrl");
  const afterImage = await getCarouselImageInput(formData, "afterImage", "afterImageUrl");

  if (!before.publicUrl || !afterImage.publicUrl) {
    return;
  }

  const slide = await db.homeCarouselSlide.create({
    data: {
      vertical,
      title: text(formData, "title") || null,
      beforeImageUrl: before.publicUrl,
      beforeStorageKey: before.storageKey,
      afterImageUrl: afterImage.publicUrl,
      afterStorageKey: afterImage.storageKey,
      beforeAlt: text(formData, "beforeAlt") || null,
      afterAlt: text(formData, "afterAlt") || null,
      sortOrder: integer(formData, "sortOrder", 0),
      isActive: formData.has("isActive"),
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "home_carousel.create",
    targetType: "HomeCarouselSlide",
    targetId: slide.id,
    summary: "اسلاید کاروسل خانه ساخته شد.",
    metadata: { title: slide.title, vertical, sortOrder: slide.sortOrder, isActive: slide.isActive },
  });

  revalidatePath("/admin/home");
  revalidatePath("/dashboard");
  redirect(homeCarouselAdminPath(vertical, slide.id));
}

export async function updateHomeCarouselSlideAction(formData: FormData) {
  const session = await requireAdminSession();
  const slideId = text(formData, "slideId");
  if (!slideId) return;

  const current = await db.homeCarouselSlide.findUnique({ where: { id: slideId } });
  if (!current) return;
  const vertical = normalizeUserVisibleVerticalId(text(formData, "vertical") || current.vertical);

  const before = await getCarouselImageInput(
    formData,
    "beforeImage",
    "beforeImageUrl",
    current.beforeImageUrl,
    current.beforeStorageKey,
  );
  const afterImage = await getCarouselImageInput(
    formData,
    "afterImage",
    "afterImageUrl",
    current.afterImageUrl,
    current.afterStorageKey,
  );

  if (!before.publicUrl || !afterImage.publicUrl) {
    return;
  }

  const slide = await db.homeCarouselSlide.update({
    where: { id: slideId },
    data: {
      vertical,
      title: text(formData, "title") || null,
      beforeImageUrl: before.publicUrl,
      beforeStorageKey: before.storageKey,
      afterImageUrl: afterImage.publicUrl,
      afterStorageKey: afterImage.storageKey,
      beforeAlt: text(formData, "beforeAlt") || null,
      afterAlt: text(formData, "afterAlt") || null,
      sortOrder: integer(formData, "sortOrder", current.sortOrder),
      isActive: formData.has("isActive"),
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "home_carousel.update",
    targetType: "HomeCarouselSlide",
    targetId: slide.id,
    summary: "اسلاید کاروسل خانه به‌روزرسانی شد.",
    metadata: { title: slide.title, vertical, sortOrder: slide.sortOrder, isActive: slide.isActive },
  });

  revalidatePath("/admin/home");
  revalidatePath("/dashboard");
  redirect(homeCarouselAdminPath(vertical, slide.id));
}

export async function deleteHomeCarouselSlideAction(formData: FormData) {
  const session = await requireAdminSession();
  const slideId = text(formData, "slideId");
  if (!slideId) return;

  const slide = await db.homeCarouselSlide.findUnique({ where: { id: slideId } });
  if (!slide) return;
  const vertical = normalizeUserVisibleVerticalId(text(formData, "vertical") || slide.vertical);

  await db.homeCarouselSlide.delete({ where: { id: slideId } });

  after(() => {
    for (const storageKey of [slide.beforeStorageKey, slide.afterStorageKey]) {
      if (!storageKey) continue;
      deleteStorageObject(storageKey).catch((error) => {
        console.error("[home-carousel-file-delete-failed]", { storageKey, error });
      });
    }
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "home_carousel.delete",
    targetType: "HomeCarouselSlide",
    targetId: slide.id,
    summary: "اسلاید کاروسل خانه حذف شد.",
    metadata: { title: slide.title, vertical },
  });

  revalidatePath("/admin/home");
  revalidatePath("/dashboard");
  redirect(homeCarouselAdminPath(vertical));
}

function isAvailableToUsers(formData: FormData) {
  return formData.has("isAvailableToUsers") || (formData.has("isActive") && formData.has("isUserVisible"));
}

async function lockUserCredits(tx: Prisma.TransactionClient, userId: string, vertical: UserVisibleVerticalId = "jewelry") {
  await tx.userVerticalCreditBalance.upsert({
    where: { userId_vertical: { userId, vertical } },
    create: { userId, vertical, credits: 0, reservedCredits: 0 },
    update: {},
  });

  const [balance] = await tx.$queryRaw<Array<{ id: string; credits: number }>>`
    SELECT id, credits
    FROM \`UserVerticalCreditBalance\`
    WHERE userId = ${userId}
      AND vertical = ${vertical}
    LIMIT 1
    FOR UPDATE
  `;

  return balance ?? null;
}

export async function updatePaymentSettingsAction(formData: FormData) {
  const session = await requireAdminSession();
  const cardholderName = text(formData, "cardholderName");
  const cardNumber = text(formData, "cardNumber");
  const instructions = text(formData, "instructions");

  if (!cardholderName || !cardNumber) {
    return;
  }

  await db.paymentSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      cardholderName,
      cardNumber,
      instructions: instructions || null,
      isActive: formData.has("isActive"),
    },
    update: {
      cardholderName,
      cardNumber,
      instructions: instructions || null,
      isActive: formData.has("isActive"),
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "payment_settings.update",
    targetType: "PaymentSettings",
    targetId: "default",
    summary: "تنظیمات کارت‌به‌کارت به‌روزرسانی شد.",
  });

  revalidateAdmin();
}

export async function createBillingPackageAction(formData: FormData) {
  const session = await requireAdminSession();
  const vertical = normalizeUserVisibleVerticalId(text(formData, "vertical"));
  const type = text(formData, "type") === "SUBSCRIPTION" ? "SUBSCRIPTION" : "CREDIT_PACK";
  const title = text(formData, "title");
  const description = text(formData, "description");
  const priceAmount = integer(formData, "priceAmount");
  const credits = visibleCreditsToCreditUnits(integer(formData, "credits"));
  const projectLimit = type === "SUBSCRIPTION" ? optionalInteger(formData, "projectLimit") : null;
  const freeVariantLimit = type === "SUBSCRIPTION" ? Math.max(0, integer(formData, "freeVariantLimit", 2)) : 0;
  const periodDays = type === "SUBSCRIPTION" ? Math.max(1, integer(formData, "periodDays", 30)) : null;

  if (!title || !description || priceAmount < 0 || credits < 0 || (projectLimit !== null && projectLimit < 0)) {
    return;
  }

  const billingPackage = await db.billingPackage.create({
    data: {
      type,
      vertical,
      title,
      description,
      priceAmount,
      currency: text(formData, "currency") || "IRR",
      credits,
      projectLimit,
      freeVariantLimit,
      periodDays,
      colorPreset: normalizeBillingPlanColorPreset(text(formData, "colorPreset")),
      sortOrder: integer(formData, "sortOrder"),
      isActive: formData.has("isActive"),
      isPublic: formData.has("isActive"),
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "package.create",
    targetType: "BillingPackage",
    targetId: billingPackage.id,
    summary: `بسته ${title} ساخته شد.`,
    metadata: { vertical, type, credits: creditUnitsToVisibleCredits(credits), creditUnits: credits },
  });

  revalidateAdmin();
}

export async function updateBillingPackageAction(formData: FormData) {
  const session = await requireAdminSession();
  const packageId = text(formData, "packageId");
  const type = text(formData, "type") === "SUBSCRIPTION" ? "SUBSCRIPTION" : "CREDIT_PACK";
  const title = text(formData, "title");
  const description = text(formData, "description");
  const priceAmount = integer(formData, "priceAmount");
  const credits = visibleCreditsToCreditUnits(integer(formData, "credits"));
  const projectLimit = type === "SUBSCRIPTION" ? optionalInteger(formData, "projectLimit") : null;
  const freeVariantLimit = type === "SUBSCRIPTION" ? Math.max(0, integer(formData, "freeVariantLimit", 2)) : 0;
  const periodDays = type === "SUBSCRIPTION" ? Math.max(1, integer(formData, "periodDays", 30)) : null;

  if (!packageId || !title || !description || priceAmount < 0 || credits < 0 || (projectLimit !== null && projectLimit < 0)) {
    return;
  }

  await db.billingPackage.update({
    where: { id: packageId },
    data: {
      type,
      title,
      description,
      priceAmount,
      currency: text(formData, "currency") || "IRR",
      credits,
      projectLimit,
      freeVariantLimit,
      periodDays,
      colorPreset: normalizeBillingPlanColorPreset(text(formData, "colorPreset")),
      sortOrder: integer(formData, "sortOrder"),
      isActive: formData.has("isActive"),
      isPublic: formData.has("isActive"),
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "package.update",
    targetType: "BillingPackage",
    targetId: packageId,
    summary: `بسته ${title} ویرایش شد.`,
    metadata: { type, credits: creditUnitsToVisibleCredits(credits), creditUnits: credits },
  });

  revalidateAdmin();
}

export async function deleteBillingPackageAction(formData: FormData) {
  const session = await requireAdminSession();
  const packageId = text(formData, "packageId");
  if (!packageId) return;

  const billingPackage = await db.billingPackage.findUnique({
    where: { id: packageId },
    select: {
      title: true,
      _count: { select: { purchaseRequests: true, subscriptions: true, creditEvents: true } },
    },
  });

  if (!billingPackage) return;

  const hasHistory =
    billingPackage._count.purchaseRequests > 0 ||
    billingPackage._count.subscriptions > 0 ||
    billingPackage._count.creditEvents > 0;

  if (hasHistory) {
    await db.billingPackage.update({
      where: { id: packageId },
      data: { isActive: false, isPublic: false },
    });
  } else {
    await db.billingPackage.delete({ where: { id: packageId } });
  }
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "package.delete",
    targetType: "BillingPackage",
    targetId: packageId,
    summary: "بسته آرشیو شد.",
  });
  revalidateAdmin();
}

export async function duplicateBillingPackageAction(formData: FormData) {
  const session = await requireAdminSession();
  const packageId = text(formData, "packageId");
  const source = await db.billingPackage.findUnique({ where: { id: packageId } });
  if (!source) return;

  const copy = await db.billingPackage.create({
    data: {
      type: source.type,
      vertical: normalizeUserVisibleVerticalId(source.vertical),
      title: `${source.title} کپی`,
      description: source.description,
      priceAmount: source.priceAmount,
      currency: source.currency,
      credits: source.credits,
      projectLimit: source.projectLimit,
      freeVariantLimit: source.freeVariantLimit,
      periodDays: source.periodDays,
      colorPreset: source.colorPreset,
      sortOrder: source.sortOrder + 1,
      isActive: false,
      isPublic: false,
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "package.duplicate",
    targetType: "BillingPackage",
    targetId: copy.id,
    summary: `کپی بسته ${source.title} ساخته شد.`,
    metadata: { sourcePackageId: source.id, vertical: copy.vertical, type: copy.type },
  });
  revalidateAdmin();
}

export async function adjustUserCreditsAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const userId = text(formData, "userId");
  const vertical = normalizeUserVisibleVerticalId(text(formData, "vertical"));
  const delta = visibleCreditsToCreditUnits(integer(formData, "delta"));
  const reason = text(formData, "reason");

  if (!userId || delta === 0 || !reason) {
    return;
  }

  const updated = await db.$transaction(async (tx) => {
    const user = await lockUserCredits(tx, userId, vertical);
    if (!user) return null;

    const nextCredits = user.credits + delta;
    if (nextCredits < 0) return null;

    await tx.userVerticalCreditBalance.update({ where: { id: user.id }, data: { credits: nextCredits } });
    await tx.creditEvent.create({
      data: {
        userId,
        vertical,
        actorAdminId: session.userId,
        delta,
        balanceBefore: user.credits,
        balanceAfter: nextCredits,
        reason,
        source: "ADMIN",
      },
    });
    return nextCredits;
  });

  if (updated !== null) {
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "credits.adjust",
      targetType: "User",
      targetId: userId,
      summary: `اعتبار کاربر ${delta > 0 ? "افزایش" : "کاهش"} یافت.`,
      metadata: { vertical, deltaCredits: creditUnitsToVisibleCredits(delta), deltaCreditUnits: delta, reason },
    });
  }

  revalidateAdmin();
}

export async function createSalesReferralCodesAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const salespersonName = text(formData, "salespersonName");
  const note = text(formData, "note");
  const requestedSalesUserId = text(formData, "salesUserId");
  const salesUserId = session.role === "SALES" ? session.userId : requestedSalesUserId || null;
  if (salesUserId && session.role === "ADMIN") {
    const salesUser = await db.user.findFirst({ where: { id: salesUserId, role: "SALES" }, select: { id: true } });
    if (!salesUser) return;
  }

  const batch = await createSalesReferralCodeBatch({
    createdByAdminId: session.userId,
    salesUserId,
    salespersonName,
    note,
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "sales_referral_codes.create_batch",
    targetType: "SalesReferralCode",
    targetId: batch.batchKey,
    summary: `۵ کد تست فروش ساخته شد.`,
    metadata: { batchKey: batch.batchKey, codes: batch.codes, salespersonName, note, salesUserId },
  });

  revalidatePath("/admin/referrals");
}

export async function updateUserCreditsAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = text(formData, "userId");
  const vertical = normalizeUserVisibleVerticalId(text(formData, "vertical"));
  const credits = visibleCreditsToCreditUnits(integer(formData, "credits"));
  if (!userId || credits < 0) return;

  const reason = "تنظیم مستقیم اعتبار از فرم قدیمی ادمین";
  const updated = await db.$transaction(async (tx) => {
    const user = await lockUserCredits(tx, userId, vertical);
    if (!user) return null;

    const delta = credits - user.credits;
    if (delta === 0) return credits;

    await tx.userVerticalCreditBalance.update({ where: { id: user.id }, data: { credits } });
    await tx.creditEvent.create({
      data: {
        userId,
        vertical,
        actorAdminId: session.userId,
        delta,
        balanceBefore: user.credits,
        balanceAfter: credits,
        reason,
        source: "ADMIN",
      },
    });
    return credits;
  });

  if (updated !== null) {
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "credits.adjust",
      targetType: "User",
      targetId: userId,
      summary: "اعتبار کاربر تنظیم شد.",
      metadata: { vertical, targetCredits: creditUnitsToVisibleCredits(credits), targetCreditUnits: credits, reason },
    });
  }

  revalidateAdmin();
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = text(formData, "userId");
  const role = parseRole(text(formData, "role"));
  const confirm = text(formData, "confirmRoleChange");

  if (!userId || confirm !== "تایید") {
    return;
  }

  if (userId === session.userId && role !== "ADMIN") {
    return;
  }

  if (role !== "ADMIN") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role === "ADMIN" && adminCount <= 1) {
      return;
    }
  }

  await db.user.update({ where: { id: userId }, data: { role } });
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "user.role",
    targetType: "User",
    targetId: userId,
    summary: `نقش کاربر به ${role} تغییر کرد.`,
  });
  revalidateAdmin();
}

export async function createAdminUserAction(formData: FormData) {
  const session = await requireAdminSession();
  const name = text(formData, "name");
  const password = String(formData.get("password") ?? "");
  const role = parseRole(text(formData, "role"));
  const email = normalizedOptionalIdentifier(formData, "email", "email");
  const phone = normalizedOptionalIdentifier(formData, "phone", "phone");

  if (name.length < 2 || name.length > 80 || password.length < 6 || email.value === undefined || phone.value === undefined) {
    return;
  }

  if (!email.value && !phone.value) {
    return;
  }

  if (await hasDuplicateIdentifier({ email: email.value, phone: phone.value })) {
    return;
  }

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email: email.value,
        phone: phone.value,
        passwordHash: await hashPassword(password),
        role,
        credits: 0,
        verticalCreditBalances: {
          create: {
            vertical: "jewelry",
            credits: INITIAL_SIGNUP_CREDITS,
          },
        },
      },
    });

    await tx.user.update({
      where: { id: created.id },
      data: { referralCode: referralCodeFromUserId(created.id) },
    });

    await tx.creditEvent.create({
      data: {
        userId: created.id,
        vertical: "jewelry",
        actorAdminId: session.userId,
        delta: INITIAL_SIGNUP_CREDITS,
        balanceBefore: 0,
        balanceAfter: INITIAL_SIGNUP_CREDITS,
        reason: "اعتبار اولیه ساخت حساب",
        source: "SIGNUP",
      },
    });

    return created;
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "user.create",
    targetType: "User",
    targetId: user.id,
    summary: `کاربر ${name} ساخته شد.`,
    metadata: { role },
  });

  revalidateAdmin();
}

export async function updateAdminUserIdentityAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = text(formData, "userId");
  const name = text(formData, "name");
  const email = normalizedOptionalIdentifier(formData, "email", "email");
  const phone = normalizedOptionalIdentifier(formData, "phone", "phone");

  if (!userId || name.length < 2 || name.length > 80 || email.value === undefined || phone.value === undefined) {
    return;
  }

  if (!email.value && !phone.value) {
    return;
  }

  if (await hasDuplicateIdentifier({ email: email.value, phone: phone.value, exceptUserId: userId })) {
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      name,
      email: email.value,
      phone: phone.value,
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "user.identity",
    targetType: "User",
    targetId: userId,
    summary: "مشخصات کاربر ویرایش شد.",
  });

  revalidateAdmin();
}

export async function updateAdminUserPasswordAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = text(formData, "userId");
  const password = String(formData.get("password") ?? "");

  if (!userId || password.length < 6) {
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(password),
      sessionVersion: { increment: 1 },
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "user.password",
    targetType: "User",
    targetId: userId,
    summary: "رمز عبور کاربر تغییر کرد.",
  });

  revalidateAdmin();
}

export async function approvePurchaseRequestAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const requestId = text(formData, "requestId");
  if (!requestId) return;

  const adminNote = text(formData, "adminNote") || null;
  const result = await db.$transaction(async (tx) => {
    const request = await tx.purchaseRequest.findFirst({
      where: { id: requestId, status: "PENDING" },
      include: { package: true },
    });
    if (!request) return null;

    const vertical = normalizeUserVisibleVerticalId(request.vertical);
    if (normalizeUserVisibleVerticalId(request.package.vertical) !== vertical) {
      return null;
    }

    const claimed = await tx.purchaseRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: { status: "APPROVED", adminNote },
    });
    if (claimed.count === 0) return null;

    if (request.package.type === "CREDIT_PACK") {
      const existingCreditEvent = await tx.creditEvent.findUnique({
        where: { purchaseRequestId: request.id },
        select: { id: true },
      });
      if (existingCreditEvent) return request;

      const user = await lockUserCredits(tx, request.userId, vertical);
      if (!user) return request;

      const balanceAfter = user.credits + request.package.credits;
      await tx.userVerticalCreditBalance.update({
        where: { id: user.id },
        data: { credits: { increment: request.package.credits } },
      });
      await tx.creditEvent.create({
        data: {
          userId: request.userId,
          vertical,
          actorAdminId: session.userId,
          delta: request.package.credits,
          balanceBefore: user.credits,
          balanceAfter,
          reason: `تایید خرید ${request.package.title}`,
          source: "PACKAGE",
          packageId: request.packageId,
          purchaseRequestId: request.id,
        },
      });
    } else {
      const existingSubscription = await tx.userSubscription.findUnique({
        where: { purchaseRequestId: request.id },
        select: { id: true },
      });
      if (existingSubscription) return request;

      const period = getSubscriptionPeriod(request.package.periodDays ?? 30);
      await tx.userSubscription.create({
        data: {
          userId: request.userId,
          vertical,
          packageId: request.packageId,
          status: "ACTIVE",
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
          periodDays: request.package.periodDays ?? 30,
          creditsPerPeriod: request.package.credits,
          creditsUsedThisPeriod: 0,
          projectLimit: request.package.projectLimit,
          projectsUsedThisPeriod: 0,
          freeVariantLimit: request.package.freeVariantLimit,
          assignedByAdminId: session.userId,
          purchaseRequestId: request.id,
          notes: `تایید درخواست خرید ${request.package.title}`,
        },
      });
    }

    await grantReferralRewardAfterFirstPurchase(tx, {
      userId: request.userId,
      purchaseRequestId: request.id,
      vertical,
    });

    return request;
  });

  if (result) {
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "purchase.approve",
      targetType: "PurchaseRequest",
      targetId: requestId,
      summary: `درخواست خرید ${result.package.title} تایید شد.`,
      metadata: { vertical: normalizeUserVisibleVerticalId(result.vertical), packageId: result.packageId },
    });
  }
  revalidateAdmin();
}

export async function rejectPurchaseRequestAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const requestId = text(formData, "requestId");
  if (!requestId) return;

  const updated = await db.purchaseRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "REJECTED", adminNote: text(formData, "adminNote") || null },
  });
  if (updated.count === 0) {
    return;
  }

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "purchase.reject",
    targetType: "PurchaseRequest",
    targetId: requestId,
    summary: "درخواست خرید رد شد.",
    metadata: { adminNote: text(formData, "adminNote") || null },
  });
  revalidateAdmin();
}

export async function assignSubscriptionAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const userId = text(formData, "userId");
  const packageId = text(formData, "packageId");
  const notes = text(formData, "notes");

  const billingPackage = await db.billingPackage.findFirst({
    where: { id: packageId, type: "SUBSCRIPTION", archivedAt: null },
  });
  if (!userId || !billingPackage) return;

  const period = getSubscriptionPeriod(billingPackage.periodDays ?? 30);
  const subscription = await db.userSubscription.create({
    data: {
      userId,
      vertical: normalizeUserVisibleVerticalId(billingPackage.vertical),
      packageId,
      status: "ACTIVE",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      periodDays: billingPackage.periodDays ?? 30,
      creditsPerPeriod: billingPackage.credits,
      creditsUsedThisPeriod: 0,
      projectLimit: billingPackage.projectLimit,
      projectsUsedThisPeriod: 0,
      freeVariantLimit: billingPackage.freeVariantLimit,
      assignedByAdminId: session.userId,
      notes: notes || null,
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "subscription.assign",
    targetType: "UserSubscription",
    targetId: subscription.id,
    summary: `اشتراک ${billingPackage.title} به کاربر اختصاص یافت.`,
    metadata: {
      userId,
      packageId,
      vertical: normalizeUserVisibleVerticalId(billingPackage.vertical),
      creditsPerPeriod: creditUnitsToVisibleCredits(billingPackage.credits),
      creditUnitsPerPeriod: billingPackage.credits,
    },
  });
  revalidateAdmin();
}

export async function assignCustomSubscriptionAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const userId = text(formData, "userId");
  const vertical = normalizeUserVisibleVerticalId(text(formData, "vertical"));
  const customTitle = text(formData, "customTitle") || "پلن اختصاصی";
  const projectLimit = integer(formData, "projectLimit");
  const creditsPerPeriod = visibleCreditsToCreditUnits(integer(formData, "creditsPerPeriod"));
  const periodDays = Math.max(1, integer(formData, "periodDays", 30));
  const freeVariantLimit = Math.max(0, integer(formData, "freeVariantLimit", 0));
  const notes = text(formData, "notes");

  if (!userId || projectLimit < 0 || creditsPerPeriod <= 0) {
    return;
  }

  const period = getSubscriptionPeriod(periodDays);
  const subscription = await db.userSubscription.create({
    data: {
      userId,
      vertical,
      packageId: null,
      customTitle,
      periodDays,
      status: "ACTIVE",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      creditsPerPeriod,
      creditsUsedThisPeriod: 0,
      projectLimit,
      projectsUsedThisPeriod: 0,
      freeVariantLimit,
      assignedByAdminId: session.userId,
      notes: notes || null,
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "subscription.assign_custom",
    targetType: "UserSubscription",
    targetId: subscription.id,
    summary: `پلن اختصاصی ${customTitle} به کاربر اختصاص یافت.`,
    metadata: {
      projectLimit,
      vertical,
      creditsPerPeriod: creditUnitsToVisibleCredits(creditsPerPeriod),
      creditUnitsPerPeriod: creditsPerPeriod,
      periodDays,
      freeVariantLimit,
    },
  });
  revalidateAdmin();
}

export async function assignCreditPackAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const userId = text(formData, "userId");
  const packageId = text(formData, "packageId");
  const notes = text(formData, "notes");

  const result = await db.$transaction(async (tx) => {
    const billingPackage = await tx.billingPackage.findFirst({
      where: { id: packageId, type: "CREDIT_PACK", archivedAt: null },
      select: { id: true, vertical: true, title: true, credits: true },
    });
    if (!userId || !billingPackage || billingPackage.credits <= 0) {
      return null;
    }
    const vertical = normalizeUserVisibleVerticalId(billingPackage?.vertical);
    const user = await lockUserCredits(tx, userId, vertical);

    if (!user) {
      return null;
    }

    const balanceAfter = user.credits + billingPackage.credits;
    await tx.userVerticalCreditBalance.update({
      where: { id: user.id },
      data: { credits: { increment: billingPackage.credits } },
    });

    const event = await tx.creditEvent.create({
      data: {
        userId,
        vertical,
        actorAdminId: session.userId,
        delta: billingPackage.credits,
        balanceBefore: user.credits,
        balanceAfter,
        reason: notes || `اختصاص دستی ${billingPackage.title}`,
        source: "ADMIN",
        packageId: billingPackage.id,
      },
    });

    return { billingPackage, event, vertical };
  });

  if (result) {
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "credits.assign_pack",
      targetType: "CreditEvent",
      targetId: result.event.id,
      summary: `بسته اعتباری ${result.billingPackage.title} به کاربر اختصاص یافت.`,
      metadata: { packageId, vertical: result.vertical, credits: creditUnitsToVisibleCredits(result.billingPackage.credits), creditUnits: result.billingPackage.credits },
    });
  }

  revalidateAdmin();
}

export async function updateSubscriptionStatusAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const subscriptionId = text(formData, "subscriptionId");
  const status = text(formData, "status");

  if (!subscriptionId || !["ACTIVE", "PAUSED", "CANCELED", "EXPIRED"].includes(status)) {
    return;
  }

  await db.userSubscription.update({
    where: { id: subscriptionId },
    data: { status: status as "ACTIVE" | "PAUSED" | "CANCELED" | "EXPIRED" },
  });
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "subscription.status",
    targetType: "UserSubscription",
    targetId: subscriptionId,
    summary: `وضعیت اشتراک به ${status} تغییر کرد.`,
  });
  revalidateAdmin();
}

export async function resetSubscriptionPeriodAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const subscriptionId = text(formData, "subscriptionId");
  const subscription = await db.userSubscription.findUnique({
    where: { id: subscriptionId },
    include: { package: true },
  });
  if (!subscription) return;

  const periodDays = subscription.periodDays ?? subscription.package?.periodDays ?? 30;
  const period = getSubscriptionPeriod(periodDays);
  await db.userSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      periodDays,
      creditsUsedThisPeriod: 0,
      creditsPerPeriod: subscription.package?.credits ?? subscription.creditsPerPeriod,
      projectLimit: subscription.package?.projectLimit ?? subscription.projectLimit,
      projectsUsedThisPeriod: 0,
      freeVariantLimit: subscription.package?.freeVariantLimit ?? subscription.freeVariantLimit,
    },
  });
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "subscription.reset",
    targetType: "UserSubscription",
    targetId: subscriptionId,
    summary: "دوره اشتراک تمدید و مصرف اعتبار صفر شد.",
  });
  revalidateAdmin();
}

export async function updateSupportSettingsAction(formData: FormData) {
  const session = await requireAdminSession();
  await db.supportSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      phone: text(formData, "phone") || null,
      whatsappUrl: text(formData, "whatsappUrl") || null,
      telegramUrl: text(formData, "telegramUrl") || null,
      instructions: text(formData, "instructions") || null,
      isActive: formData.has("isActive"),
    },
    update: {
      phone: text(formData, "phone") || null,
      whatsappUrl: text(formData, "whatsappUrl") || null,
      telegramUrl: text(formData, "telegramUrl") || null,
      instructions: text(formData, "instructions") || null,
      isActive: formData.has("isActive"),
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "support_settings.update",
    targetType: "SupportSettings",
    targetId: "default",
    summary: "تنظیمات پشتیبانی به‌روزرسانی شد.",
  });
  revalidateAdmin();
  revalidatePath("/account/support");
}

export async function replySupportTicketAction(formData: FormData) {
  const session = await requireAdminSession();
  const ticketId = text(formData, "ticketId");
  const body = text(formData, "body");
  if (!ticketId || !body) return;

  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "ANSWERED",
      messages: {
        create: {
          authorType: "ADMIN",
          adminId: session.userId,
          body,
        },
      },
    },
  });

  revalidatePath("/admin/support");
  revalidatePath("/account/support");
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  await requireAdminSession();
  const ticketId = text(formData, "ticketId");
  const status = text(formData, "status");
  if (!ticketId || !["OPEN", "ANSWERED", "CLOSED"].includes(status)) return;

  await db.supportTicket.update({
    where: { id: ticketId },
    data: { status: status as "OPEN" | "ANSWERED" | "CLOSED" },
  });

  revalidatePath("/admin/support");
  revalidatePath("/account/support");
}

export async function sendAdminNotificationAction(formData: FormData) {
  const session = await requireAdminOrSalesSession();
  const audience = text(formData, "audience");
  const userId = text(formData, "userId");
  const title = text(formData, "title");
  const body = text(formData, "body");
  const href = text(formData, "href");

  if (!title || !body) {
    return;
  }

  if (audience === "broadcast") {
    if (session.role !== "ADMIN") {
      return;
    }

    const count = await createAdminBroadcastNotification({
      title,
      body,
      href: href || null,
      createdByAdminId: session.userId,
    });
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "notification.broadcast",
      targetType: "UserNotification",
      targetId: "broadcast",
      summary: `پیام عمومی برای ${count.toLocaleString("fa-IR")} کاربر ارسال شد.`,
      metadata: { count, title, href: href || null },
    });
  } else {
    const notification = userId
      ? await createAdminUserNotification({
          userId,
          title,
          body,
          href: href || null,
          createdByAdminId: session.userId,
        })
      : null;

    if (!notification) {
      return;
    }

    await logAdminAudit({
      actorAdminId: session.userId,
      action: "notification.send",
      targetType: "UserNotification",
      targetId: notification.id,
      summary: "پیام دستی برای کاربر ارسال شد.",
      metadata: { userId, title, href: href || null },
    });
  }

  revalidatePath("/admin/notifications");
  revalidatePath("/admin/users");
  revalidatePath("/account/notifications");
  revalidatePath("/dashboard");
}

export async function approveQualityReviewAction(formData: FormData) {
  const session = await requireAdminSession();
  const reviewId = text(formData, "reviewId");
  const adminNote = text(formData, "adminNote");
  if (!reviewId) return;

  const result = await approveQualityReviewWithRefund({
    reviewId,
    adminId: session.userId,
    adminNote,
  });

  if (result) {
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "quality_review.approve_refund",
      targetType: "QualityReview",
      targetId: result.review.id,
      summary: "درخواست بررسی کیفیت تایید و اعتبار برگشت داده شد.",
      metadata: { projectId: result.review.projectId, creditEventId: result.creditEvent.id },
    });
  }

  revalidatePath("/admin/quality-reviews");
  revalidatePath("/admin/projects");
  revalidatePath("/account/notifications");
  revalidatePath("/dashboard");
}

export async function rejectQualityReviewAction(formData: FormData) {
  const session = await requireAdminSession();
  const reviewId = text(formData, "reviewId");
  const adminNote = text(formData, "adminNote");
  if (!reviewId) return;

  const review = await rejectQualityReview({
    reviewId,
    adminId: session.userId,
    adminNote,
  });

  if (review) {
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "quality_review.reject",
      targetType: "QualityReview",
      targetId: review.id,
      summary: "درخواست بررسی کیفیت رد شد.",
      metadata: { projectId: review.projectId },
    });
  }

  revalidatePath("/admin/quality-reviews");
  revalidatePath("/account/notifications");
  revalidatePath("/dashboard");
}

export async function createFaqItemAction(formData: FormData) {
  const session = await requireAdminSession();
  const question = text(formData, "question");
  const answer = text(formData, "answer");
  if (!question || !answer) return;

  const item = await db.faqItem.create({
    data: {
      question,
      answer,
      sortOrder: integer(formData, "sortOrder"),
      isActive: formData.has("isActive"),
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "faq.create",
    targetType: "FaqItem",
    targetId: item.id,
    summary: "سوال پرتکرار ساخته شد.",
  });
  revalidatePath("/admin/support");
  revalidatePath("/account/faq");
}

export async function updateFaqItemAction(formData: FormData) {
  const session = await requireAdminSession();
  const faqId = text(formData, "faqId");
  const question = text(formData, "question");
  const answer = text(formData, "answer");
  if (!faqId || !question || !answer) return;

  await db.faqItem.update({
    where: { id: faqId },
    data: {
      question,
      answer,
      sortOrder: integer(formData, "sortOrder"),
      isActive: formData.has("isActive"),
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "faq.update",
    targetType: "FaqItem",
    targetId: faqId,
    summary: "سوال پرتکرار ویرایش شد.",
  });
  revalidatePath("/admin/support");
  revalidatePath("/account/faq");
}

export async function reconcileApprovedPurchasesAction() {
  const session = await requireAdminSession();
  const requests = await db.purchaseRequest.findMany({
    where: { status: "APPROVED" },
    include: {
      package: true,
      user: { select: { id: true } },
      creditEvent: true,
      subscription: true,
    },
    take: 100,
    orderBy: { updatedAt: "desc" },
  });

  let linked = 0;
  let ambiguous = 0;

  for (const request of requests) {
    if (request.package.type === "CREDIT_PACK") {
      if (request.creditEvent) continue;
      const matches = await db.creditEvent.findMany({
        where: {
          userId: request.userId,
          packageId: request.packageId,
          source: "PACKAGE",
          purchaseRequestId: null,
        },
        orderBy: { createdAt: "desc" },
        take: 2,
      });
      if (matches.length === 1) {
        await db.creditEvent.update({ where: { id: matches[0].id }, data: { purchaseRequestId: request.id } });
        linked += 1;
      } else {
        ambiguous += 1;
      }
      continue;
    }

    if (request.subscription) continue;
    const matches = await db.userSubscription.findMany({
      where: {
        userId: request.userId,
        packageId: request.packageId,
        purchaseRequestId: null,
        notes: { contains: request.package.title },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    });
    if (matches.length === 1) {
      await db.userSubscription.update({ where: { id: matches[0].id }, data: { purchaseRequestId: request.id } });
      linked += 1;
    } else {
      ambiguous += 1;
    }
  }

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "purchase.reconcile",
    targetType: "PurchaseRequest",
    targetId: "approved",
    summary: `آشتی خریدهای تاییدشده انجام شد. لینک‌شده: ${linked}، مبهم: ${ambiguous}`,
    metadata: { linked, ambiguous },
  });
  revalidateAdmin();
}

export async function retryAdminProjectAction(formData: FormData) {
  const session = await requireAdminSession();
  const projectId = text(formData, "projectId");
  if (!projectId) return;

  const updated = await db.project.updateMany({
    where: { id: projectId, status: { in: ["FAILED", "PROCESSING", "QUEUED"] }, archivedAt: null, sourceAssetId: { not: null } },
    data: {
      status: "QUEUED",
      errorMessage: null,
      resultImageUrl: null,
      resultStorageKey: null,
      generationQueuedAt: new Date(),
      generationStartedAt: null,
      generationFinishedAt: null,
    },
  });

  if (updated.count > 0) {
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "project.retry",
      targetType: "Project",
      targetId: projectId,
      summary: "پروژه از پنل ادمین دوباره وارد صف شد.",
    });
    after(() => processImageProject(projectId));
  }

  revalidateAdmin();
}

export async function archiveAdminProjectAction(formData: FormData) {
  const session = await requireAdminSession();
  const projectId = text(formData, "projectId");
  if (!projectId) return;

  await db.project.updateMany({
    where: { id: projectId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "project.archive",
    targetType: "Project",
    targetId: projectId,
    summary: "پروژه از پنل ادمین آرشیو شد.",
  });
  revalidateAdmin();
}

export async function archiveAdminAssetAction(formData: FormData) {
  const session = await requireAdminSession();
  const assetId = text(formData, "assetId");
  if (!assetId) return;

  await db.productAsset.updateMany({
    where: { id: assetId, archivedAt: null },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "asset.archive",
    targetType: "ProductAsset",
    targetId: assetId,
    summary: "دارایی گالری از پنل ادمین آرشیو شد.",
  });
  revalidateAdmin();
}

export async function updateCreativeStyleAction(formData: FormData) {
  const session = await requireAdminSession();
  const styleId = text(formData, "styleId");
  const name = text(formData, "name");
  const description = text(formData, "description");
  const prompt = text(formData, "prompt");
  const previewImageUrl = await getStylePreviewImageUrl(formData, text(formData, "currentPreviewImageUrl"));
  const sortOrder = integer(formData, "sortOrder");
  const vertical = normalizeVerticalId(text(formData, "vertical"));

  if (!styleId || !name || !description || !prompt || !previewImageUrl) {
    return;
  }

  const previous = await db.creativeStyle.findUnique({
    where: { id: styleId },
    select: { name: true, prompt: true, isUserVisible: true },
  });

  const availableToUsers = isAvailableToUsers(formData);

  await db.creativeStyle.update({
    where: { id: styleId },
    data: {
      name,
      description,
      prompt,
      previewImageUrl,
      vertical,
      sortOrder,
      isActive: availableToUsers,
      isUserVisible: availableToUsers,
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "style.update",
    targetType: "CreativeStyle",
    targetId: styleId,
    summary: `سبک ${name} ویرایش شد.`,
    metadata: {
      previousName: previous?.name,
      vertical,
      promptChanged: previous?.prompt !== prompt,
      wasUserVisible: previous?.isUserVisible,
      isUserVisible: availableToUsers,
    },
  });

  revalidatePath("/admin/styles");
  revalidatePath("/projects/new");
  revalidatePath("/gallery");
}

export async function createCreativeStyleAction(formData: FormData) {
  const session = await requireAdminSession();
  const name = text(formData, "name");
  const description = text(formData, "description");
  const prompt = text(formData, "prompt");
  const previewImageUrl = await getStylePreviewImageUrl(formData, "/images/placeholders/jewelry/style-minimal.webp");
  const vertical = normalizeVerticalId(text(formData, "vertical"));

  if (!name || !description || !prompt || !previewImageUrl) {
    return;
  }

  const availableToUsers = isAvailableToUsers(formData);

  const style = await db.creativeStyle.create({
    data: {
      name,
      description,
      prompt,
      previewImageUrl,
      vertical,
      sortOrder: integer(formData, "sortOrder"),
      isActive: availableToUsers,
      isUserVisible: availableToUsers,
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "style.create",
    targetType: "CreativeStyle",
    targetId: style.id,
    summary: `سبک ${name} ساخته شد.`,
    metadata: { vertical },
  });

  revalidatePath("/admin/styles");
  revalidatePath("/projects/new");
  revalidatePath("/gallery");
}

export async function updateStyleControlAction(formData: FormData) {
  const session = await requireAdminSession();
  const controlId = text(formData, "controlId");
  const key = text(formData, "key");
  const label = text(formData, "label");
  const type = parseStyleControlType(text(formData, "type"));
  const defaultValue = text(formData, "defaultValue");
  const optionsJson = normalizeControlOptions(text(formData, "optionsJson"), type);

  if (!controlId || !key || !label) {
    return;
  }

  const control = await db.styleControl.update({
    where: { id: controlId },
    data: {
      key,
      label,
      type,
      optionsJson,
      defaultValue: defaultValue || null,
      minValue: type === "RANGE" ? optionalInteger(formData, "minValue") : null,
      maxValue: type === "RANGE" ? optionalInteger(formData, "maxValue") : null,
      sortOrder: integer(formData, "sortOrder"),
      isActive: formData.has("isActive"),
    },
    select: { id: true },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "style_control.update",
    targetType: "StyleControl",
    targetId: control.id,
    summary: `کنترل ${label} ویرایش شد.`,
  });

  revalidatePath("/admin/styles");
  revalidatePath("/projects/new");
  revalidatePath("/gallery");
}

export async function createStyleControlAction(formData: FormData) {
  const session = await requireAdminSession();
  const styleId = text(formData, "styleId");
  const key = text(formData, "key");
  const label = text(formData, "label");
  const type = parseStyleControlType(text(formData, "type"));
  const defaultValue = text(formData, "defaultValue");
  const optionsJson = normalizeControlOptions(text(formData, "optionsJson"), type);

  if (!styleId || !key || !label) {
    return;
  }

  const control = await db.styleControl.upsert({
    where: { styleId_key: { styleId, key } },
    create: {
      styleId,
      key,
      label,
      type,
      optionsJson,
      defaultValue: defaultValue || null,
      minValue: type === "RANGE" ? optionalInteger(formData, "minValue") : null,
      maxValue: type === "RANGE" ? optionalInteger(formData, "maxValue") : null,
      sortOrder: integer(formData, "sortOrder"),
      isActive: formData.has("isActive"),
    },
    update: {
      label,
      type,
      optionsJson,
      defaultValue: defaultValue || null,
      minValue: type === "RANGE" ? optionalInteger(formData, "minValue") : null,
      maxValue: type === "RANGE" ? optionalInteger(formData, "maxValue") : null,
      sortOrder: integer(formData, "sortOrder"),
      isActive: formData.has("isActive"),
    },
    select: { id: true },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "style_control.create",
    targetType: "StyleControl",
    targetId: control.id,
    summary: `کنترل ${label} ساخته شد.`,
  });

  revalidatePath("/admin/styles");
  revalidatePath("/projects/new");
  revalidatePath("/gallery");
}

export async function deleteStyleControlAction(formData: FormData) {
  const session = await requireAdminSession();
  const controlId = text(formData, "controlId");
  if (!controlId) return;

  const control = await db.styleControl.findUnique({
    where: { id: controlId },
    select: { id: true, label: true, styleId: true },
  });

  if (!control) return;

  await db.styleControl.delete({ where: { id: controlId } });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "style_control.delete",
    targetType: "StyleControl",
    targetId: control.id,
    summary: `کنترل ${control.label} حذف شد.`,
    metadata: { styleId: control.styleId },
  });

  revalidatePath("/admin/styles");
  revalidatePath("/projects/new");
  revalidatePath("/gallery");
}
