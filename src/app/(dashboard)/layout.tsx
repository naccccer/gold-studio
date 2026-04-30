import { DashboardMasthead } from "@/components/ui/dashboard-masthead";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireUserSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true },
  });

  const quietName = user?.name || user?.email || "حساب کاربری";

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-4 text-right text-foreground sm:px-6 sm:pt-5">
      <div className="mx-auto w-full max-w-5xl">
        <DashboardMasthead userLabel={quietName} isAdmin={session.role === "ADMIN"} />
        {children}
      </div>
    </div>
  );
}
