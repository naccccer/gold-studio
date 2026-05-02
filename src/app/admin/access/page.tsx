import { AdminAccessScreen } from "@/features/admin/screens/admin-access-screen";
import type { AdminUserListItem } from "@/features/admin/screens/admin-home-screen";
import { db } from "@/lib/db";

export default async function AdminAccessPage() {
  const users = (await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      credits: true,
    },
  })) as AdminUserListItem[];

  return <AdminAccessScreen users={users} />;
}
