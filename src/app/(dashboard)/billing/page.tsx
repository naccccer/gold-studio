import { notFound } from "next/navigation";
import { BillingScreen } from "@/features/account/screens/billing-screen";
import { requireUserSession } from "@/lib/auth/session";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type BillingPageProps = {
  searchParams?: Promise<{ tab?: string; request?: string; discountError?: string }>;
};

const billingTabs = ["packages", "credits", "payment", "receipts"] as const;

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const params = await searchParams;
  const requestedTab = params?.tab;
  const selectedRequestId = params?.request?.trim() || null;
  const activeTab = billingTabs.includes(requestedTab as (typeof billingTabs)[number])
    ? (requestedTab as (typeof billingTabs)[number])
    : "packages";

  const [user, packages, purchaseRequests, paymentSettings, selectedPurchaseRequest] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { id: true },
    }),
    db.billingPackage.findMany({
      where: { vertical, isActive: true, isPublic: true, archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        priceAmount: true,
        currency: true,
        credits: true,
        projectLimit: true,
        freeVariantLimit: true,
        periodDays: true,
        colorPreset: true,
      },
    }),
    db.purchaseRequest.findMany({
      where: { userId: session.userId, vertical, status: { not: "CANCELED" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        packageId: true,
        status: true,
        amount: true,
        originalAmount: true,
        currency: true,
        discountCodeId: true,
        discountCodeSnapshot: true,
        discountTypeSnapshot: true,
        discountValueSnapshot: true,
        discountAmount: true,
        discountReservedUntil: true,
        receiptImageUrl: true,
        receiptStorageKey: true,
        receiptSubmittedAt: true,
        updatedAt: true,
        package: { select: { title: true, type: true, colorPreset: true } },
      },
    }),
    db.paymentSettings.findUnique({ where: { id: "default" } }),
    selectedRequestId
      ? db.purchaseRequest.findFirst({
          where: { id: selectedRequestId, userId: session.userId, vertical, status: "PENDING" },
          select: {
            id: true,
            packageId: true,
            status: true,
            amount: true,
            originalAmount: true,
            currency: true,
            discountCodeId: true,
            discountCodeSnapshot: true,
            discountTypeSnapshot: true,
            discountValueSnapshot: true,
            discountAmount: true,
            discountReservedUntil: true,
            receiptImageUrl: true,
            receiptStorageKey: true,
            receiptSubmittedAt: true,
            updatedAt: true,
            package: { select: { title: true, type: true, colorPreset: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <BillingScreen
      packages={packages.map((billingPackage) => ({
        ...billingPackage,
      }))}
      purchaseRequests={purchaseRequests.map((request) => ({
        ...request,
        receiptImageUrl: storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl),
      }))}
      selectedPurchaseRequest={
        selectedPurchaseRequest
          ? {
              ...selectedPurchaseRequest,
              receiptImageUrl: storageUrlFromKeyOrUrl(
                selectedPurchaseRequest.receiptStorageKey,
                selectedPurchaseRequest.receiptImageUrl,
              ),
            }
          : null
      }
      paymentSettings={paymentSettings}
      activeTab={activeTab}
      discountError={params?.discountError ?? null}
    />
  );
}
