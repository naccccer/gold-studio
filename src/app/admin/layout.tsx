import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdminOrSalesSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdminOrSalesSession();

  return <AdminShell role={session.role}>{children}</AdminShell>;
}
