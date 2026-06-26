import { notFound } from "next/navigation";
import { AccountScreen } from "@/features/account/screens/account-screen";
import { requireUserSession } from "@/lib/auth/session";
import { getUserCreditSummary } from "@/lib/billing";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const [user, purchaseRequests, creditSummary] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, phone: true, role: true },
    }),
    db.purchaseRequest.findMany({
      where: { userId: session.userId, vertical, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        receiptSubmittedAt: true,
        package: { select: { title: true } },
      },
    }),
    getUserCreditSummary(session.userId, vertical),
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
      pendingRequests={purchaseRequests}
      activeSubscription={creditSummary.activeSubscription}
    />
  );
}
