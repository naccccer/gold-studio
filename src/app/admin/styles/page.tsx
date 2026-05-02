import { AdminStylesScreen } from "@/features/admin/screens/admin-styles-screen";
import { db } from "@/lib/db";

export default async function AdminStylesPage() {
  const styles = await db.creativeStyle.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      category: true,
      controls: {
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return <AdminStylesScreen styles={styles} />;
}
