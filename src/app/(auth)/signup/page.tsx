import Link from "next/link";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function SignupPage() {
  return (
    <PlaceholderPage
      eyebrow="SIGNUP"
      title="ساخت حساب جدید"
      description="ثبت‌نام هنوز پیاده‌سازی نشده است. فعلا این صفحه مسیر موقت شروع کاربر در MVP را نگه می‌دارد."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          شروع موقت در داشبورد
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          رفتن به ورود
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
