import Link from "next/link";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function MarketingPage() {
  return (
    <PlaceholderPage
      eyebrow="GOLD STUDIO"
      title="استودیوی هوشمند تصویر محصول"
      description="این صفحه فعلا نسخه موقت معرفی محصول است و بعدا به لندینگ کامل MVP تبدیل می‌شود."
    >
      <div className="grid gap-3">
        <Link
          href="/login"
          className="flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          ورود
        </Link>
      </div>
    </PlaceholderPage>
  );
}
