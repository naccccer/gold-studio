import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { QuietMeta, StudioFrame } from "@/components/ui/studio-primitives";
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
    <div className="min-h-screen bg-background pb-10 text-right text-foreground sm:pb-14">
      <StudioFrame className="space-y-6 pt-5 sm:space-y-8 sm:pt-7">
        <header className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">GOLD STUDIO</p>
              <h1 className="text-lg font-semibold text-foreground">استودیوی تولید تصویر محصول</h1>
              <QuietMeta>{user?.name || user?.email} • اعتبار: نامحدود</QuietMeta>
            </div>

            <ButtonLink href="/projects/new" className="w-full sm:w-auto">
              شروع ساخت تصویر
            </ButtonLink>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
              <Link href="/projects/new" className="font-medium text-foreground transition-colors hover:text-foreground-soft">
                استودیو
              </Link>
              <Link href="/projects" className="transition-colors hover:text-foreground">
                آرشیو
              </Link>
              <Link href="/dashboard" className="transition-colors hover:text-foreground">
                خانه
              </Link>
              {session.role === "ADMIN" ? (
                <Link href="/admin" className="text-[13px] text-muted-foreground transition-colors hover:text-muted">
                  پنل مدیریت
                </Link>
              ) : null}
            </nav>
            <LogoutButton />
          </div>
        </header>

        <main>{children}</main>
      </StudioFrame>
    </div>
  );
}
