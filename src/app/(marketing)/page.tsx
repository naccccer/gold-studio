import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ffffff_42%,_#f8fafc_100%)] px-4 py-8 text-right text-slate-900">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-xs font-semibold tracking-[0.24em] text-amber-700">GOLD STUDIO</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-950">
          تبدیل عکس خام محصول به تصویر استودیویی حرفه‌ای
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          مناسب فروشندگان طلا و محصول: آپلود عکس، انتخاب سبک، تحویل خروجی آماده فروش.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/signup" className="flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800">
            شروع رایگان
          </Link>
          <Link href="/login" className="flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            ورود
          </Link>
        </div>
      </section>
    </main>
  );
}
