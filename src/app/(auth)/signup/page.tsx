import Link from "next/link";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function SignupPage() {
  return (
    <PlaceholderPage
      eyebrow="SIGNUP"
      title="ساخت حساب جدید"
      description="ثبت‌نام هنوز پیاده‌سازی نشده است. این صفحه برای نگه‌داشتن ساختار تمیز MVP اضافه شده است."
    >
      <Link
        href="/login"
        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        رفتن به ورود
      </Link>
    </PlaceholderPage>
  );
}
