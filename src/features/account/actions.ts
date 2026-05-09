"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserSession } from "@/lib/auth/session";

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
