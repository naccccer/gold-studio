import { notFound } from "next/navigation";
import { AccountScreen } from "@/features/account/screens/account-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireUserSession();
  const [user, packages, purchaseRequests, activeSubscription, paymentSettings] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, phone: true, role: true, credits: true },
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
      },
    }),
    db.purchaseRequest.findMany({
      where: { userId: session.userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        packageId: true,
        amount: true,
        currency: true,
        receiptImageUrl: true,
        receiptSubmittedAt: true,
        package: { select: { title: true } },
      },
    }),
    db.userSubscription.findFirst({
      where: { userId: session.userId, status: "ACTIVE", currentPeriodEnd: { gt: new Date() } },
      orderBy: { currentPeriodEnd: "desc" },
      include: { package: { select: { title: true } } },
    }),
    db.paymentSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <AccountScreen
      name={user.name}
      email={user.email}
      phone={user.phone}
      role={user.role}
      credits={user.credits}
      packages={packages}
      pendingRequests={purchaseRequests}
      paymentSettings={paymentSettings}
      activeSubscription={
        activeSubscription
          ? {
              title: activeSubscription.package.title,
              creditsPerPeriod: activeSubscription.creditsPerPeriod,
              creditsUsedThisPeriod: activeSubscription.creditsUsedThisPeriod,
              currentPeriodEnd: activeSubscription.currentPeriodEnd,
            }
          : null
      }
    />
  );
}
