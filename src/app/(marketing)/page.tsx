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
          <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent-soft bg-surface text-accent-foreground">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
              <path
                d="M12 3.75l1.55 4.08 4.08 1.55-4.08 1.55L12 15l-1.55-4.07-4.08-1.55 4.08-1.55L12 3.75Z"
                fill="currentColor"
              />
              <path
                d="M18.25 14.5l.8 2.02 2.02.8-2.02.8-.8 2.02-.8-2.02-2.02-.8 2.02-.8.8-2.02Z"
                fill="currentColor"
                opacity="0.55"
              />
            </svg>
          </span>
        </header>

        <div className="mt-7 space-y-4">
          <div className="space-y-1">
            <h1 className="font-display text-[2.4rem] font-bold leading-[1.36] text-foreground sm:text-5xl">
              طلای حرفه‌ای
            </h1>
            <p className="text-sm text-muted">تصویر محصول، آماده فروش.</p>
          </div>

          <div className="overflow-hidden rounded-[2.05rem] border border-border/70 bg-surface shadow-[0_30px_80px_-54px_rgba(23,20,17,0.55)]">
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
