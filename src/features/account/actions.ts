"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { normalizeLoginIdentifier } from "@/lib/auth/identifier";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, requireUserSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { markAllUserNotificationsRead } from "@/lib/notifications";
import { applyReferralOrSalesCodeForUser } from "@/lib/referrals";
import { saveReceiptFile } from "@/lib/uploads";
import { getCurrentVertical } from "@/lib/current-vertical";
import { normalizeUserVisibleVerticalId } from "@/lib/verticals";
import {
  applyDiscountToPurchaseRequest,
  discountErrorMessage,
  type DiscountActionState,
  removeDiscountFromPurchaseRequest,
  isDiscountReservationValidForReceipt,
} from "@/lib/discounts";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createPurchaseRequestAction(formData: FormData) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const packageId = String(formData.get("packageId") ?? "").trim();

  if (!packageId) {
    return;
  }

  const billingPackage = await db.billingPackage.findFirst({
    where: {
      id: packageId,
      vertical,
      isActive: true,
      isPublic: true,
      archivedAt: null,
    },
  });

  if (!billingPackage) {
    return;
  }

  const existingPending = await db.purchaseRequest.findFirst({
    where: {
      userId: session.userId,
      packageId: billingPackage.id,
      vertical,
      status: "PENDING",
    },
    select: { id: true },
  });

  const request = existingPending ??
    (await db.purchaseRequest.create({
      data: {
        userId: session.userId,
        vertical,
        packageId: billingPackage.id,
        originalAmount: billingPackage.priceAmount,
        amount: billingPackage.priceAmount,
        currency: billingPackage.currency,
      },
      select: { id: true },
    }));

  revalidatePath("/account");
  revalidatePath("/billing");
  redirect(`/billing?tab=payment&request=${encodeURIComponent(request.id)}`);
}

export async function applyDiscountCodeAction(
  _previousState: DiscountActionState,
  formData: FormData,
): Promise<DiscountActionState> {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const requestId = text(formData, "requestId");
  const code = text(formData, "code");

  if (!requestId || !code) {
    return { status: "error", message: discountErrorMessage("INVALID_CODE") };
  }

  const limited = await checkRateLimit({
    scope: "discount:apply",
    identifier: session.userId,
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return { status: "error", message: "تعداد تلاش‌ها زیاد است؛ چند دقیقه دیگر دوباره امتحان کنید." };
  }

  const result = await applyDiscountToPurchaseRequest({
    userId: session.userId,
    vertical: normalizeUserVisibleVerticalId(vertical),
    requestId,
    rawCode: code,
  });
  if (!result.ok) {
    return { status: "error", message: discountErrorMessage(result.error) };
  }

  revalidatePath("/billing");
  return {
    status: "success",
    message: "کد تخفیف اعمال شد و مبلغ نهایی به‌روزرسانی شد.",
    breakdown: {
      originalAmount: result.originalAmount,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      currency: result.currency,
      code: result.code,
      reservedUntil: result.reservedUntil.toISOString(),
    },
  };
}

export async function removeDiscountCodeAction(
  _previousState: DiscountActionState,
  formData: FormData,
): Promise<DiscountActionState> {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const requestId = text(formData, "requestId");
  if (!requestId) return { status: "error", message: discountErrorMessage("REQUEST_NOT_FOUND") };

  const result = await removeDiscountFromPurchaseRequest({
    userId: session.userId,
    vertical: normalizeUserVisibleVerticalId(vertical),
    requestId,
  });
  if (!result.ok) return { status: "error", message: discountErrorMessage(result.error) };

  revalidatePath("/billing");
  return { status: "success", message: "کد تخفیف حذف شد و مبلغ خرید به حالت اولیه برگشت." };
}

export async function submitPurchaseReceiptAction(formData: FormData) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const receiptNote = String(formData.get("receiptNote") ?? "").trim();
  const receipt = formData.getAll("receipt").find((value): value is File => value instanceof File && value.size > 0);

  if (!requestId || !(receipt instanceof File)) {
    return;
  }

  const limited = await checkRateLimit({
    scope: "receipt:upload",
    identifier: session.userId,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return;
  }

  const request = await db.purchaseRequest.findFirst({
    where: {
      id: requestId,
      userId: session.userId,
      vertical,
      status: "PENDING",
    },
    select: { id: true, discountCodeId: true, discountReservedUntil: true, receiptSubmittedAt: true },
  });

  if (!request) {
    return;
  }

  if (!isDiscountReservationValidForReceipt(request)) {
    redirect(`/billing?tab=payment&request=${encodeURIComponent(request.id)}&discountError=reservation_expired`);
  }

  const uploaded = await saveReceiptFile(receipt);
  await db.purchaseRequest.update({
    where: { id: request.id },
    data: {
      receiptImageUrl: uploaded.publicUrl,
      receiptStorageKey: uploaded.storageKey,
      receiptNote: receiptNote || null,
      receiptSubmittedAt: new Date(),
    },
  });

  revalidatePath("/account");
  revalidatePath("/billing");
}

export async function deletePurchaseRequestAction(formData: FormData) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const requestId = String(formData.get("requestId") ?? "").trim();

  if (!requestId) {
    return;
  }

  const request = await db.purchaseRequest.findFirst({
    where: {
      id: requestId,
      userId: session.userId,
      vertical,
      status: { not: "APPROVED" },
    },
    select: { id: true },
  });

  if (!request) {
    return;
  }

  await db.purchaseRequest.delete({
    where: { id: request.id },
  });

  revalidatePath("/account");
  revalidatePath("/billing");
}

export async function updateProfileAction(formData: FormData) {
  const session = await requireUserSession();
  const name = text(formData, "name");
  const emailInput = text(formData, "email");
  const phoneInput = text(formData, "phone");
  const email = emailInput ? normalizeLoginIdentifier(emailInput) : null;
  const phone = phoneInput ? normalizeLoginIdentifier(phoneInput) : null;

  if ((emailInput && email?.kind !== "email") || (phoneInput && phone?.kind !== "phone")) {
    return;
  }

  const duplicateChecks = [
    ...(email?.kind === "email" ? [{ email: email.value }] : []),
    ...(phone?.kind === "phone" ? [{ phone: phone.value }] : []),
  ];
  if (duplicateChecks.length > 0) {
    const duplicate = await db.user.findFirst({
      where: {
        id: { not: session.userId },
        OR: duplicateChecks,
      },
      select: { id: true },
    });
    if (duplicate) return;
  }

  await db.user.update({
    where: { id: session.userId },
    data: {
      name: name || null,
      email: email?.kind === "email" ? email.value : null,
      phone: phone?.kind === "phone" ? phone.value : null,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
}

export type OnboardingNameState = {
  error?: string;
  success?: boolean;
};

export async function completeOnboardingNameAction(
  _prevState: OnboardingNameState,
  formData: FormData,
): Promise<OnboardingNameState> {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const name = text(formData, "name");
  const enteredReferralCode = text(formData, "referralCode");

  if (name.length < 2) {
    return { error: "نام باید حداقل ۲ کاراکتر باشد." };
  }

  if (name.length > 80) {
    return { error: "نام باید حداکثر ۸۰ کاراکتر باشد." };
  }

  const codeResult = await db.$transaction(async (tx) =>
    enteredReferralCode
      ? applyReferralOrSalesCodeForUser(tx, {
          userId: session.userId,
          rawCode: enteredReferralCode,
          vertical,
        })
      : { status: "empty" as const },
  );

  if (codeResult.status === "invalid") {
    return { error: "کد واردشده معتبر نیست." };
  }

  if (codeResult.status === "sales_code_redeemed") {
    return { error: "این کد قبلا استفاده شده است." };
  }

  await db.user.update({
    where: { id: session.userId },
    data: { name },
  });

  revalidatePath("/dashboard");
  revalidatePath("/account");
  revalidatePath("/account/profile");

  return { success: true };
}

export async function dismissStartGuideAction() {
  const session = await requireUserSession();

  await db.user.update({
    where: { id: session.userId },
    data: { startGuideSeenAt: new Date() },
  });

  revalidatePath("/dashboard");
}

export async function updateOutputSettingsAction(formData: FormData) {
  const session = await requireUserSession();
  const defaultOutputPreset = ["post", "story", "banner"].includes(text(formData, "defaultOutputPreset"))
    ? text(formData, "defaultOutputPreset")
    : "post";
  const preferredQuality = ["1K", "2K", "4K"].includes(text(formData, "preferredQuality")) ? text(formData, "preferredQuality") : "2K";
  const fileNamingMode = ["project-date", "original-name", "style-date"].includes(text(formData, "fileNamingMode"))
    ? text(formData, "fileNamingMode")
    : "project-date";

  await db.userOutputSettings.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      defaultOutputPreset,
      preferredQuality,
      fileNamingMode,
      autoSaveToProjects: formData.has("autoSaveToProjects"),
    },
    update: {
      defaultOutputPreset,
      preferredQuality,
      fileNamingMode,
      autoSaveToProjects: formData.has("autoSaveToProjects"),
    },
  });

  revalidatePath("/account/output-settings");
  revalidatePath("/projects/new");
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireUserSession();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 6) return;
  if (newPassword !== confirmPassword) return;

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
  if (!user) return;

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return;

  await db.user.update({
    where: { id: session.userId },
    data: {
      passwordHash: await hashPassword(newPassword),
      sessionVersion: { increment: 1 },
    },
  });

  await createSession({ userId: session.userId, role: session.role });
  revalidatePath("/account/profile");
}

export async function createSupportTicketAction(formData: FormData) {
  const session = await requireUserSession();
  const subject = text(formData, "subject");
  const body = text(formData, "body");
  if (!subject || !body) return;

  const ticket = await db.supportTicket.create({
    data: {
      userId: session.userId,
      subject,
      messages: {
        create: {
          authorType: "USER",
          userId: session.userId,
          body,
        },
      },
    },
  });

  revalidatePath("/account/support");
  revalidatePath("/admin/support");
  redirect(`/account/support?ticketId=${ticket.id}`);
}

export async function replySupportTicketAction(formData: FormData) {
  const session = await requireUserSession();
  const ticketId = text(formData, "ticketId");
  const body = text(formData, "body");
  if (!ticketId || !body) return;

  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, userId: session.userId, status: { not: "CLOSED" } },
    select: { id: true },
  });
  if (!ticket) return;

  await db.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: "OPEN",
      messages: {
        create: {
          authorType: "USER",
          userId: session.userId,
          body,
        },
      },
    },
  });

  revalidatePath("/account/support");
  revalidatePath("/admin/support");
}

export async function markAllNotificationsReadAction() {
  const session = await requireUserSession();
  await markAllUserNotificationsRead(session.userId);
  revalidatePath("/account/notifications");
  revalidatePath("/dashboard");
}
