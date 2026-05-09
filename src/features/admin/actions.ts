"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";
import { getSubscriptionPeriod, logAdminAudit } from "@/lib/billing";
import { processImageProject } from "@/lib/generation/jobs";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function integer(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseInt(String(formData.get(key) ?? ""), 10);
  return Number.isFinite(value) ? value : fallback;
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/packages");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/styles");
  revalidatePath("/account");
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
  const type = text(formData, "type") === "SUBSCRIPTION" ? "SUBSCRIPTION" : "CREDIT_PACK";
  const title = text(formData, "title");
  const description = text(formData, "description");
  const priceAmount = integer(formData, "priceAmount");
  const credits = integer(formData, "credits");
  const periodDays = type === "SUBSCRIPTION" ? Math.max(1, integer(formData, "periodDays", 30)) : null;

  if (!title || !description || priceAmount < 0 || credits < 0) {
    return;
  }

  const billingPackage = await db.billingPackage.create({
    data: {
      type,
      title,
      description,
      priceAmount,
      currency: text(formData, "currency") || "IRR",
      credits,
      periodDays,
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
  const credits = integer(formData, "credits");
  const periodDays = type === "SUBSCRIPTION" ? Math.max(1, integer(formData, "periodDays", 30)) : null;

  if (!packageId || !title || !description || priceAmount < 0 || credits < 0) {
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
      periodDays,
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
      title: `${source.title} کپی`,
      description: source.description,
      priceAmount: source.priceAmount,
      currency: source.currency,
      credits: source.credits,
      periodDays: source.periodDays,
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
  });
  revalidateAdmin();
}

export async function adjustUserCreditsAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = text(formData, "userId");
  const delta = integer(formData, "delta");
  const reason = text(formData, "reason");

  if (!userId || delta === 0 || !reason) {
    return;
  }

  const updated = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
    if (!user) return null;

    const nextCredits = user.credits + delta;
    if (nextCredits < 0) return null;

    await tx.user.update({ where: { id: userId }, data: { credits: nextCredits } });
    await tx.creditEvent.create({
      data: {
        userId,
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
      metadata: { delta, reason },
    });
  }

  revalidateAdmin();
}

export async function updateUserCreditsAction(formData: FormData) {
  await requireAdminSession();
  const userId = text(formData, "userId");
  const credits = integer(formData, "credits");
  if (!userId || credits < 0) return;

  const current = await db.user.findUnique({ where: { id: userId }, select: { credits: true } });
  if (!current) return;

  const nextForm = new FormData();
  nextForm.set("userId", userId);
  nextForm.set("delta", String(credits - current.credits));
  nextForm.set("reason", "تنظیم مستقیم اعتبار از فرم قدیمی ادمین");
  await adjustUserCreditsAction(nextForm);
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = text(formData, "userId");
  const role = text(formData, "role") === "ADMIN" ? "ADMIN" : "USER";
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

export async function approvePurchaseRequestAction(formData: FormData) {
  const session = await requireAdminSession();
  const requestId = text(formData, "requestId");
  if (!requestId) return;

  const result = await db.$transaction(async (tx) => {
    const request = await tx.purchaseRequest.findUnique({
      where: { id: requestId },
      include: { package: true, user: { select: { credits: true } } },
    });
    if (!request || request.status !== "PENDING") return null;
    if (!request.receiptImageUrl) return null;

    await tx.purchaseRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED", adminNote: text(formData, "adminNote") || null },
    });

    if (request.package.type === "CREDIT_PACK") {
      const balanceAfter = request.user.credits + request.package.credits;
      await tx.user.update({
        where: { id: request.userId },
        data: { credits: balanceAfter },
      });
      await tx.creditEvent.create({
        data: {
          userId: request.userId,
          actorAdminId: session.userId,
          delta: request.package.credits,
          balanceBefore: request.user.credits,
          balanceAfter,
          reason: `تایید خرید ${request.package.title}`,
          source: "PACKAGE",
          packageId: request.packageId,
        },
      });
    } else {
      const period = getSubscriptionPeriod(request.package.periodDays ?? 30);
      await tx.userSubscription.create({
        data: {
          userId: request.userId,
          packageId: request.packageId,
          status: "ACTIVE",
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
          creditsPerPeriod: request.package.credits,
          creditsUsedThisPeriod: 0,
          assignedByAdminId: session.userId,
          notes: `تایید درخواست خرید ${request.package.title}`,
        },
      });
    }

    return request;
  });

  if (result) {
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "purchase.approve",
      targetType: "PurchaseRequest",
      targetId: requestId,
      summary: `درخواست خرید ${result.package.title} تایید شد.`,
    });
  }
  revalidateAdmin();
}

export async function rejectPurchaseRequestAction(formData: FormData) {
  const session = await requireAdminSession();
  const requestId = text(formData, "requestId");
  if (!requestId) return;

  await db.purchaseRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", adminNote: text(formData, "adminNote") || null },
  });
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "purchase.reject",
    targetType: "PurchaseRequest",
    targetId: requestId,
    summary: "درخواست خرید رد شد.",
  });
  revalidateAdmin();
}

export async function assignSubscriptionAction(formData: FormData) {
  const session = await requireAdminSession();
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
      packageId,
      status: "ACTIVE",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      creditsPerPeriod: billingPackage.credits,
      creditsUsedThisPeriod: 0,
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
  });
  revalidateAdmin();
}

export async function updateSubscriptionStatusAction(formData: FormData) {
  const session = await requireAdminSession();
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
  const session = await requireAdminSession();
  const subscriptionId = text(formData, "subscriptionId");
  const subscription = await db.userSubscription.findUnique({
    where: { id: subscriptionId },
    include: { package: true },
  });
  if (!subscription) return;

  const period = getSubscriptionPeriod(subscription.package.periodDays ?? 30);
  await db.userSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      creditsUsedThisPeriod: 0,
      creditsPerPeriod: subscription.package.credits,
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

export async function retryAdminProjectAction(formData: FormData) {
  const session = await requireAdminSession();
  const projectId = text(formData, "projectId");
  if (!projectId) return;

  const updated = await db.project.updateMany({
    where: { id: projectId, status: "FAILED", archivedAt: null, sourceAssetId: { not: null } },
    data: { status: "QUEUED", errorMessage: null, resultImageUrl: null, resultStorageKey: null },
  });

  if (updated.count > 0) {
    await logAdminAudit({
      actorAdminId: session.userId,
      action: "project.retry",
      targetType: "Project",
      targetId: projectId,
      summary: "پروژه ناموفق دوباره وارد صف شد.",
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
  const previewImageUrl = text(formData, "previewImageUrl");
  const sortOrder = integer(formData, "sortOrder");

  if (!styleId || !name || !description || !prompt || !previewImageUrl) {
    return;
  }

  const previous = await db.creativeStyle.findUnique({
    where: { id: styleId },
    select: { name: true, prompt: true, isUserVisible: true },
  });

  await db.creativeStyle.update({
    where: { id: styleId },
    data: {
      name,
      description,
      prompt,
      previewImageUrl,
      sortOrder,
      isActive: formData.has("isActive"),
      isUserVisible: formData.has("isUserVisible"),
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
      promptChanged: previous?.prompt !== prompt,
      wasUserVisible: previous?.isUserVisible,
      isUserVisible: formData.has("isUserVisible"),
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
  const previewImageUrl = text(formData, "previewImageUrl");

  if (!name || !description || !prompt || !previewImageUrl) {
    return;
  }

  const style = await db.creativeStyle.create({
    data: {
      name,
      description,
      prompt,
      previewImageUrl,
      sortOrder: integer(formData, "sortOrder"),
      isActive: formData.has("isActive"),
      isUserVisible: formData.has("isUserVisible"),
    },
  });

  await logAdminAudit({
    actorAdminId: session.userId,
    action: "style.create",
    targetType: "CreativeStyle",
    targetId: style.id,
    summary: `سبک ${name} ساخته شد.`,
  });

  revalidatePath("/admin/styles");
  revalidatePath("/projects/new");
  revalidatePath("/gallery");
}
