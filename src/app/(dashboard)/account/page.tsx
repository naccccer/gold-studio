import { notFound } from "next/navigation";
import { AccountScreen } from "@/features/account/screens/account-screen";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function AccountPage() {
  const session = await requireUserSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true, credits: true },
  });

  if (!user) {
    notFound();
  }

  return <AccountScreen name={user.name} email={user.email} role={user.role} credits={user.credits} />;
}
