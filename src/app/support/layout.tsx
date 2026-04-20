import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logout } from "@/features/auth/actions";
import { getDefaultRouteByRole, hasRouteAccess } from "@/features/auth/role-routing";

export default async function SupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/login");
  }

  if (!hasRouteAccess(session.user.role, "support")) {
    redirect(getDefaultRouteByRole(session.user.role));
  }

  return (
    <div className="min-h-screen bg-cyan-50 px-4 py-4 text-right text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col rounded-[2rem] border border-cyan-200 bg-white shadow-[0_24px_80px_-32px_rgba(8,145,178,0.25)]">
        <header className="border-b border-cyan-200 px-4 py-4 sm:px-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-cyan-700">GOLD STUDIO SUPPORT</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-slate-950">پنل پشتیبانی</h1>
              <p className="text-sm text-slate-600">{session.user.email}</p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-full border border-cyan-200 px-4 text-sm font-medium text-cyan-900 transition-colors hover:bg-cyan-100"
              >
                بازگشت به سایت
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-cyan-300 px-4 text-sm font-medium text-cyan-900 transition-colors hover:bg-cyan-100"
                >
                  خروج
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
