import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { BeforeAfterImage } from "@/components/ui/before-after-image";
import { ButtonLink } from "@/components/ui/button";
import { homeHero, uploadPreview } from "@/lib/placeholders/jewelry-images";

export default function MarketingPage() {
  return (
    <main className="h-dvh max-h-dvh overflow-hidden bg-background px-4 py-4 text-right text-foreground sm:px-8 sm:py-6">
      <section className="mx-auto flex h-full w-full max-w-md flex-col gap-4">
        <header className="flex items-center justify-between gap-3">
          <div className="h-10 w-10" aria-hidden="true" />
          <div className="text-left leading-none" dir="ltr">
            <p className="font-display text-[18px] tracking-[0.16em] text-accent-foreground">OVALA</p>
            <p className="mt-1 text-[9px] tracking-[0.42em] text-accent">STUDIO</p>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center gap-4">
          <div className="space-y-2.5">
            <h1 className="text-display text-[2rem] leading-[1.35] text-foreground sm:text-5xl">
              عکس محصول، آماده فروش
            </h1>
            <p className="max-w-[28ch] text-sm leading-7 text-muted">
              عکس خام محصول را به تصویر تمیز و آماده فروش تبدیل کنید.
            </p>
          </div>

          <BeforeAfterImage
            before={uploadPreview}
            after={homeHero}
            priority
            sizes="(max-width: 768px) 100vw, 560px"
            className="h-[36dvh] min-h-64 max-h-[330px] rounded-[1.7rem] border border-border/65 shadow-[var(--shadow-soft)]"
          />

          <div className="grid gap-2.5">
            <ButtonLink href="/signup" className="h-12 rounded-[0.95rem] text-[13px]">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              شروع
            </ButtonLink>
            <p className="text-center text-xs text-muted">
              حساب دارید؟{" "}
              <Link href="/login" className="inline-flex items-center gap-1 font-medium text-foreground">
                ورود
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
