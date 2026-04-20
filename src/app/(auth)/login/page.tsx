import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/features/auth/login-form";
import { getDefaultRouteByRole } from "@/features/auth/role-routing";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(getDefaultRouteByRole(session.user.role));
  }

  return (
    <PlaceholderPage
      eyebrow="LOGIN"
      title="ورود به حساب"
      description="برای دسترسی به داشبورد یا پنل داخلی، با ایمیل و رمز عبور وارد شوید."
    >
      <LoginForm />
      <Link
        href="/"
        className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        بازگشت به صفحه اصلی
      </Link>
    </PlaceholderPage>
  );
}
