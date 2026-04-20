import Link from "next/link";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function MarketingPage() {
  return (
    <PlaceholderPage
      eyebrow="GOLD STUDIO"
      title="استودیوی هوشمند تصویر محصول"
      description="این صفحه فعلا نسخه موقت معرفی محصول است و بعدا به لندینگ کامل MVP تبدیل می‌شود."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/signup"
          className="flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          شروع
        </Link>
        <Link
          href="/login"
          className="flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          ورود
        </Link>
      </div>
    </PlaceholderPage>
  );
}
