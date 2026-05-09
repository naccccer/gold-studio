"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";
import { saveReceiptFile } from "@/lib/uploads";

export async function createPurchaseRequestAction(formData: FormData) {
  const session = await requireUserSession();
  const packageId = String(formData.get("packageId") ?? "").trim();

  if (!packageId) {
    return;
  }

  const billingPackage = await db.billingPackage.findFirst({
    where: {
      id: packageId,
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
      status: "PENDING",
    },
    select: { id: true },
  });

  if (!existingPending) {
    await db.purchaseRequest.create({
      data: {
        userId: session.userId,
        packageId: billingPackage.id,
        amount: billingPackage.priceAmount,
        currency: billingPackage.currency,
      },
    });
  }

  revalidatePath("/account");
}

export async function submitPurchaseReceiptAction(formData: FormData) {
  const session = await requireUserSession();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const receiptNote = String(formData.get("receiptNote") ?? "").trim();
  const receipt = formData.getAll("receipt").find((value): value is File => value instanceof File && value.size > 0);

  if (!requestId || !(receipt instanceof File)) {
    return;
  }

  const request = await db.purchaseRequest.findFirst({
    where: {
      id: requestId,
      userId: session.userId,
      status: "PENDING",
    },
    select: { id: true },
  });

  if (!request) {
    return;
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
}
