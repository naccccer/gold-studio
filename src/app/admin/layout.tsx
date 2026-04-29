import Link from "next/link";
import { QuietMeta, StudioFrame } from "@/components/ui/studio-primitives";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background pb-10 text-right text-foreground sm:pb-14">
      <StudioFrame className="max-w-4xl space-y-5 pt-5 sm:space-y-7 sm:pt-7">
        <header className="space-y-3 border-b border-border-soft pb-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">GOLD STUDIO / ADMIN</p>
            <h1 className="text-base font-semibold text-foreground">ابزار مدیریت داخلی</h1>
            <QuietMeta>این بخش برای عملیات پشتیبانی است و بخشی از جریان اصلی استودیو نیست.</QuietMeta>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <Link href="/projects/new" className="font-medium text-foreground transition-colors hover:text-foreground-soft">
              بازگشت به استودیو
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="transition-colors hover:text-foreground">
                خانه
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main>{children}</main>
      </StudioFrame>
    </div>
  );
}
