import Link from "next/link";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function LoginPage() {
  return (
    <PlaceholderPage
      eyebrow="LOGIN"
      title="ورود به حساب"
      description="ورود هنوز پیاده‌سازی نشده است. این صفحه فقط جایگاه موقت جریان احراز هویت در MVP است."
    >
      <Link
        href="/signup"
        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        رفتن به ثبت‌نام
      </Link>
    </PlaceholderPage>
  );
}
