import Link from "next/link";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function LoginPage() {
  return (
    <PlaceholderPage
      eyebrow="LOGIN"
      title="ورود به حساب"
      description="ورود هنوز پیاده‌سازی نشده است. فعلا از این صفحه به عنوان دروازه موقت ورود به MVP استفاده می‌کنیم."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          ورود موقت به داشبورد
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          رفتن به ثبت‌نام
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:col-span-2"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </PlaceholderPage>
  );
}
