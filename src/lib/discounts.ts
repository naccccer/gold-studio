import type { DiscountScope, DiscountType, Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { normalizeUserVisibleVerticalId, type UserVisibleVerticalId } from "@/lib/verticals";

export const DISCOUNT_RESERVATION_MS = 24 * 60 * 60 * 1000;

export type DiscountActionState = {
  status: "idle" | "success" | "error";
  message: string;
  breakdown?: {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    currency: string;
    code: string;
    reservedUntil: string;
  };
};

export const INITIAL_DISCOUNT_ACTION_STATE: DiscountActionState = { status: "idle", message: "" };

export type DiscountFailureCode =
  | "INVALID_CODE"
  | "INACTIVE_CODE"
  | "NOT_STARTED"
  | "EXPIRED_CODE"
  | "OUT_OF_SCOPE"
  | "USAGE_LIMIT_REACHED"
  | "ALREADY_USED"
  | "ZERO_AMOUNT"
  | "REQUEST_LOCKED"
  | "REQUEST_NOT_FOUND"
  | "RESERVATION_EXPIRED";

const discountErrorMessages: Record<DiscountFailureCode, string> = {
  INVALID_CODE: "کد تخفیف معتبر نیست.",
  INACTIVE_CODE: "این کد تخفیف فعال نیست.",
  NOT_STARTED: "زمان استفاده از این کد هنوز شروع نشده است.",
  EXPIRED_CODE: "مهلت استفاده از این کد به پایان رسیده است.",
  OUT_OF_SCOPE: "این کد برای بسته انتخاب‌شده قابل استفاده نیست.",
  USAGE_LIMIT_REACHED: "ظرفیت استفاده از این کد تکمیل شده است.",
  ALREADY_USED: "این کد قبلاً برای حساب شما استفاده یا رزرو شده است.",
  ZERO_AMOUNT: "این تخفیف مبلغ خرید را صفر می‌کند و برای پرداخت کارت‌به‌کارت قابل استفاده نیست.",
  REQUEST_LOCKED: "پس از ارسال رسید، کد تخفیف قابل تغییر نیست.",
  REQUEST_NOT_FOUND: "درخواست خرید پیدا نشد.",
  RESERVATION_EXPIRED: "رزرو کد تخفیف منقضی شده است؛ لطفاً کد را دوباره اعمال کنید.",
};

export function discountErrorMessage(code: DiscountFailureCode) {
  return discountErrorMessages[code];
}

export function normalizeDiscountCode(value: string) {
  return value.normalize("NFKC").trim().toUpperCase();
}

export function isValidDiscountCodeFormat(value: string) {
  return /^[A-Z0-9_-]{3,32}$/.test(normalizeDiscountCode(value));
}

export function calculateDiscountAmount(originalAmount: number, type: DiscountType, value: number) {
  if (type === "PERCENTAGE") {
    return Math.floor((originalAmount * value) / 100);
  }
  return value;
}

export function parseTehranDateTime(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
  const parsed = new Date(`${withSeconds}+03:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateTimeLocalInTehran(value: Date | null | undefined) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

type PurchaseDiscountView = {
  originalAmount: number;
  amount: number;
  discountCodeId: string | null;
  discountAmount: number;
  discountReservedUntil: Date | null;
  receiptSubmittedAt: Date | null;
};

export function getPurchaseDiscountView(request: PurchaseDiscountView, now = new Date()) {
  const expired = Boolean(
    request.discountCodeId &&
      !request.receiptSubmittedAt &&
      (!request.discountReservedUntil || request.discountReservedUntil <= now),
  );
  return {
    expired,
    payableAmount: expired ? request.originalAmount : request.amount,
    effectiveDiscountAmount: expired ? 0 : request.discountAmount,
  };
}

function appliesToPackage({
  scope,
  vertical,
  packageIds,
  packageId,
  packageVertical,
}: {
  scope: DiscountScope;
  vertical: string | null;
  packageIds: string[];
  packageId: string;
  packageVertical: string;
}) {
  if (scope === "ALL_PACKAGES") return true;
  if (scope === "VERTICAL") return vertical === packageVertical;
  return packageIds.includes(packageId);
}

function activeUseWhere(discountCodeId: string, now: Date, excludeRequestId?: string): Prisma.PurchaseRequestWhereInput {
  return {
    discountCodeId,
    ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
    OR: [
      { status: "APPROVED" },
      { status: "PENDING", receiptSubmittedAt: { not: null } },
      { status: "PENDING", receiptSubmittedAt: null, discountReservedUntil: { gt: now } },
    ],
  };
}

export async function applyDiscountToPurchaseRequest({
  userId,
  vertical,
  requestId,
  rawCode,
}: {
  userId: string;
  vertical: UserVisibleVerticalId;
  requestId: string;
  rawCode: string;
}) {
  const codeValue = normalizeDiscountCode(rawCode);
  if (!isValidDiscountCodeFormat(codeValue)) {
    return { ok: false as const, error: "INVALID_CODE" as const };
  }

  return db.$transaction(async (tx) => {
    const request = await tx.purchaseRequest.findFirst({
      where: { id: requestId, userId, vertical, status: "PENDING" },
      include: { package: { select: { id: true, vertical: true } } },
    });
    if (!request) return { ok: false as const, error: "REQUEST_NOT_FOUND" as const };
    if (request.receiptSubmittedAt) return { ok: false as const, error: "REQUEST_LOCKED" as const };

    const [lockedCode] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM \`DiscountCode\` WHERE code = ${codeValue} LIMIT 1 FOR UPDATE
    `;
    if (!lockedCode) return { ok: false as const, error: "INVALID_CODE" as const };

    const discountCode = await tx.discountCode.findUnique({
      where: { id: lockedCode.id },
      include: { packages: { select: { packageId: true } } },
    });
    if (!discountCode || discountCode.archivedAt) return { ok: false as const, error: "INVALID_CODE" as const };

    const now = new Date();
    if (!discountCode.isActive) return { ok: false as const, error: "INACTIVE_CODE" as const };
    if (discountCode.startsAt && discountCode.startsAt > now) return { ok: false as const, error: "NOT_STARTED" as const };
    if (discountCode.expiresAt && discountCode.expiresAt <= now) return { ok: false as const, error: "EXPIRED_CODE" as const };
    if (
      !appliesToPackage({
        scope: discountCode.scope,
        vertical: discountCode.vertical,
        packageIds: discountCode.packages.map((item) => item.packageId),
        packageId: request.packageId,
        packageVertical: request.package.vertical,
      })
    ) {
      return { ok: false as const, error: "OUT_OF_SCOPE" as const };
    }

    const usageWhere = activeUseWhere(discountCode.id, now, request.id);
    const [totalUses, userUses] = await Promise.all([
      tx.purchaseRequest.count({ where: usageWhere }),
      tx.purchaseRequest.count({ where: { ...usageWhere, userId } }),
    ]);
    if (discountCode.maxRedemptions !== null && totalUses >= discountCode.maxRedemptions) {
      return { ok: false as const, error: "USAGE_LIMIT_REACHED" as const };
    }
    if (userUses > 0) return { ok: false as const, error: "ALREADY_USED" as const };

    const originalAmount = request.originalAmount;
    if (discountCode.type === "FIXED_AMOUNT" && request.currency !== "IRR") {
      return { ok: false as const, error: "OUT_OF_SCOPE" as const };
    }
    const discountAmount = calculateDiscountAmount(originalAmount, discountCode.type, discountCode.value);
    const finalAmount = originalAmount - discountAmount;
    if (discountAmount <= 0 || finalAmount <= 0) return { ok: false as const, error: "ZERO_AMOUNT" as const };

    const defaultReservationEnd = new Date(now.getTime() + DISCOUNT_RESERVATION_MS);
    const reservedUntil = discountCode.expiresAt && discountCode.expiresAt < defaultReservationEnd
      ? discountCode.expiresAt
      : defaultReservationEnd;

    await tx.purchaseRequest.update({
      where: { id: request.id },
      data: {
        amount: finalAmount,
        discountCodeId: discountCode.id,
        discountCodeSnapshot: discountCode.code,
        discountTypeSnapshot: discountCode.type,
        discountValueSnapshot: discountCode.value,
        discountAmount,
        discountAppliedAt: now,
        discountReservedUntil: reservedUntil,
      },
    });

    return {
      ok: true as const,
      originalAmount,
      discountAmount,
      finalAmount,
      currency: request.currency,
      code: discountCode.code,
      reservedUntil,
    };
  });
}

export async function removeDiscountFromPurchaseRequest({
  userId,
  vertical,
  requestId,
}: {
  userId: string;
  vertical: UserVisibleVerticalId;
  requestId: string;
}) {
  const request = await db.purchaseRequest.findFirst({
    where: { id: requestId, userId, vertical: normalizeUserVisibleVerticalId(vertical), status: "PENDING" },
    select: { id: true, originalAmount: true, receiptSubmittedAt: true },
  });
  if (!request) return { ok: false as const, error: "REQUEST_NOT_FOUND" as const };
  if (request.receiptSubmittedAt) return { ok: false as const, error: "REQUEST_LOCKED" as const };

  await db.purchaseRequest.update({
    where: { id: request.id },
    data: {
      amount: request.originalAmount,
      discountCodeId: null,
      discountCodeSnapshot: null,
      discountTypeSnapshot: null,
      discountValueSnapshot: null,
      discountAmount: 0,
      discountAppliedAt: null,
      discountReservedUntil: null,
    },
  });
  return { ok: true as const };
}

export function isDiscountReservationValidForReceipt(request: {
  discountCodeId: string | null;
  discountReservedUntil: Date | null;
  receiptSubmittedAt: Date | null;
}, now = new Date()) {
  if (!request.discountCodeId || request.receiptSubmittedAt) return true;
  return Boolean(request.discountReservedUntil && request.discountReservedUntil > now);
}
