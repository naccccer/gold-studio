import Link from "next/link";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";
import { LogoutButton } from "@/features/auth/components/logout-button";
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
    select: { name: true, email: true, role: true, credits: true },
  });

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-4 text-right text-foreground sm:pt-5">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex items-center justify-between gap-4 py-1">
          <div className="space-y-0.5">
            <Link href="/dashboard" className="font-display text-lg text-foreground sm:text-xl">
              Gold Studio
            </Link>
            <p className="text-[10px] text-muted/70">{user?.name || user?.email}</p>
          </div>

          <div className="hidden items-center gap-1.5 text-sm md:flex">
            <Link
              href="/projects/new"
              className="inline-flex h-8 items-center rounded-[var(--radius-md)] border border-border bg-surface px-3 text-foreground"
            >
              پروژه جدید
            </Link>
            <Link href="/dashboard" className="inline-flex h-8 items-center rounded-[var(--radius-md)] px-2.5 text-muted hover:text-foreground">
              خانه
            </Link>
            <Link href="/projects" className="inline-flex h-8 items-center rounded-[var(--radius-md)] px-2.5 text-muted hover:text-foreground">
              آرشیو
            </Link>
            {session.role === "ADMIN" ? (
              <Link href="/admin" className="inline-flex h-8 items-center rounded-[var(--radius-md)] px-2.5 text-muted hover:text-foreground">
                مدیریت
              </Link>
            ) : null}
            <LogoutButton />
          </div>
        </header>

        <div className="space-y-6">{children}</div>
      </div>

      <MobileTabBar
        tabs={[
          { href: "/dashboard", label: "خانه", active: true },
          { href: "/projects", label: "آرشیو" },
          { href: "/admin", label: "مدیریت", active: false },
          { href: "/dashboard", label: "پروفایل" },
        ]}
        centerAction={{ href: "/projects/new", label: "پروژه جدید" }}
      />
    </div>
  );
}
