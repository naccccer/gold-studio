import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDefaultRouteByRole } from "@/features/auth/role-routing";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/login");
  }

  redirect(getDefaultRouteByRole(session.user.role));
}
