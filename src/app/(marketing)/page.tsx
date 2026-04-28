import { ButtonLink } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <main className="min-h-screen px-4 py-10 text-right sm:py-14">
      <section className="mx-auto w-full max-w-3xl space-y-8 rounded-[var(--radius-xl)] border border-border/80 bg-surface px-5 py-8 sm:px-8 sm:py-12">
        <div className="space-y-4">
          <p className="text-sm text-muted">Gold Studio</p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            استودیوی هوشمند تصویر محصول
            <br />
            برای برندهایی که خروجی حرفه‌ای می‌خواهند.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
            در چند دقیقه عکس خام محصول را به تصویر تبلیغاتی آماده فروش تبدیل کن؛ ساده، سریع و با تمرکز بر کیفیت نهایی.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/signup" className="w-full sm:w-auto">
            شروع پروژه جدید
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" className="w-full sm:w-auto">
            ورود به حساب
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
