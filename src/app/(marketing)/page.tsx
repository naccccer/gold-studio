import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { homeHero } from "@/lib/placeholders/jewelry-images";

export default function MarketingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background px-4 pb-6 pt-5 text-right text-foreground sm:px-8">
      <section className="mx-auto flex min-h-[calc(100svh-2.75rem)] w-full max-w-md flex-col">
        <header className="flex items-start justify-between gap-4">
          <div className="text-left leading-none text-muted" dir="ltr">
            <p className="font-display text-[18px] tracking-[0.16em] text-accent-foreground">GOLD</p>
            <p className="mt-1 text-[9px] tracking-[0.42em] text-accent">STUDIO</p>
          </div>
          <ButtonLink href="/login" variant="secondary" size="sm" className="h-9 w-9 rounded-full p-0" aria-label="ورود به حساب">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
              <circle cx="12" cy="8" r="3.4" fill="currentColor" opacity="0.82" />
              <path d="M5.75 19.2c.33-2.86 2.66-4.73 6.25-4.73 3.6 0 5.92 1.87 6.25 4.73" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </ButtonLink>
        </header>

        <div className="mt-7 space-y-4">
          <div className="space-y-1">
            <h1 className="font-display text-[2.4rem] font-bold leading-[1.36] text-foreground sm:text-5xl">
              طلای حرفه‌ای
            </h1>
            <p className="text-sm text-muted">تصویر محصول، آماده فروش.</p>
          </div>

          <div className="relative overflow-hidden rounded-[2.05rem] border border-border/70 bg-surface shadow-[0_30px_80px_-54px_rgba(23,20,17,0.55)]">
            <div className="relative h-[58svh] min-h-[430px] w-full">
              <Image
                src={homeHero.src}
                alt={homeHero.alt}
                fill
                priority
                className="object-cover object-[52%_58%]"
                sizes="(max-width: 768px) 100vw, 560px"
              />
            </div>

            <div className="grid gap-2.5 border-t border-border/60 bg-surface px-3.5 pb-3.5 pt-3">
              <ButtonLink href="/signup" className="h-12 rounded-[1rem] text-[13px]">
                شروع پروژه جدید
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" className="h-11 rounded-[1rem] bg-transparent text-[13px]">
                ورود به حساب
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
