import Image from "next/image";
import { LogIn, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { homeHero } from "@/lib/placeholders/jewelry-images";

export default function MarketingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background px-4 pb-5 pt-5 text-right text-foreground sm:px-8">
      <section className="mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between gap-3">
          <ButtonLink
            href="/login"
            variant="secondary"
            size="sm"
            className="h-10 w-10 rounded-full p-0"
            aria-label="ورود"
          >
            <LogIn aria-hidden="true" className="h-4 w-4" />
          </ButtonLink>

          <div className="text-left leading-none" dir="ltr">
            <p className="font-display text-[18px] tracking-[0.16em] text-accent-foreground">OVALA</p>
            <p className="mt-1 text-[9px] tracking-[0.42em] text-accent">STUDIO</p>
          </div>
        </header>

        <div className="mt-7 flex flex-1 flex-col justify-end gap-4">
          <div className="space-y-2">
            <h1 className="text-display text-[2.35rem] leading-[1.35] text-foreground sm:text-5xl">
              استودیوی تصویر OVALA
            </h1>
            <p className="max-w-[28ch] text-sm leading-7 text-muted">
              عکس خام محصول را به تصویر تمیز و آماده فروش تبدیل کنید.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[1.8rem] border border-border/70 bg-surface">
            <div className="relative h-[58svh] min-h-[420px] w-full">
              <Image
                src={homeHero.src}
                alt={homeHero.alt}
                fill
                priority
                className="object-cover object-[52%_58%]"
                sizes="(max-width: 768px) 100vw, 560px"
              />
            </div>

            <div className="grid gap-2 border-t border-border/60 bg-surface px-3.5 pb-3.5 pt-3">
              <ButtonLink href="/signup" className="h-12 rounded-[0.95rem] text-[13px]">
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                شروع
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" className="h-11 rounded-[0.95rem] bg-transparent text-[13px]">
                ورود
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
