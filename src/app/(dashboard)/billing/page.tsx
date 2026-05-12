import { notFound } from "next/navigation";
import { BillingScreen } from "@/features/account/screens/billing-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type BillingPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

const billingTabs = ["packages", "credits", "payment", "receipts"] as const;

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await requireUserSession();
  const params = await searchParams;
  const requestedTab = params?.tab;
  const activeTab = billingTabs.includes(requestedTab as (typeof billingTabs)[number])
    ? (requestedTab as (typeof billingTabs)[number])
    : "packages";

  const [user, packages, purchaseRequests, paymentSettings] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { id: true },
    }),
    db.billingPackage.findMany({
      where: { isActive: true, isPublic: true, archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        priceAmount: true,
        currency: true,
        credits: true,
        periodDays: true,
        colorPreset: true,
      },
    }),
    db.purchaseRequest.findMany({
      where: { userId: session.userId, status: { not: "CANCELED" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        packageId: true,
        status: true,
        amount: true,
        currency: true,
        receiptImageUrl: true,
        receiptSubmittedAt: true,
        updatedAt: true,
        package: { select: { title: true } },
      },
    }),
    db.paymentSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <BillingScreen
      packages={packages}
      purchaseRequests={purchaseRequests}
      paymentSettings={paymentSettings}
      activeTab={activeTab}
    />
  );
}
