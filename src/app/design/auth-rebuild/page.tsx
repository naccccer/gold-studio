import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowLeft, Eye, LockKeyhole, Mail, Sparkles, UserPlus } from "lucide-react";
import { archiveItems, homeHero, uploadPreview } from "@/lib/placeholders/jewelry-images";

const phoneFrameClass =
  "relative h-[852px] w-[393px] shrink-0 overflow-hidden rounded-[2rem] bg-[#f7f1e8] text-right text-[#171411] shadow-[0_32px_90px_-58px_rgba(23,20,17,0.65)]";

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="text-left leading-none" dir="ltr">
      <p className={["font-display text-[19px] tracking-[0.18em]", light ? "text-[#fffdf9]" : "text-[#171411]"].join(" ")}>
        OVALA
      </p>
      <p className={["mt-1 text-[8px] tracking-[0.42em]", light ? "text-[#e4c995]" : "text-[#b28b52]"].join(" ")}>
        STUDIO
      </p>
    </div>
  );
}

function BeforeAfterHero({ compact = false }: { compact?: boolean }) {
  return (
    <div className={["ov-auth-concept-before-after relative isolate overflow-hidden", compact ? "h-[236px]" : "h-[430px]"].join(" ")}>
      <Image src={uploadPreview.src} alt={uploadPreview.alt} fill priority className="object-cover object-[43%_58%]" sizes="393px" />
      <Image src={homeHero.src} alt={homeHero.alt} fill priority className="ov-auth-concept-after object-cover object-[52%_58%]" sizes="393px" />
      <div className="ov-auth-concept-divider absolute inset-y-0 z-10 w-px bg-white/80" />
      <span className="absolute right-4 top-4 z-20 rounded-full bg-white/78 px-2.5 py-1 text-[10px] font-medium text-[#6d665d] backdrop-blur">
        قبل
      </span>
      <span className="absolute left-4 top-4 z-20 rounded-full bg-[#171411]/78 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
        بعد
      </span>
      <div className="absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-[#f7f1e8] via-[#f7f1e8]/72 to-transparent" />
    </div>
  );
}

function PrimaryButton({ children }: { children: ReactNode }) {
  return (
    <button className="flex h-12 w-full items-center justify-center gap-2 rounded-[1rem] bg-[#171411] text-[13px] font-semibold text-[#fffdf9] shadow-[0_20px_34px_-28px_rgba(23,20,17,0.85)]">
      {children}
    </button>
  );
}

function SoftField({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-medium text-[#554d43]">{label}</span>
      <span className="flex h-12 items-center gap-2 rounded-[1rem] border border-[#d8c9b3] bg-white/62 px-3 text-[#8a7f70] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
        {icon}
      </span>
    </label>
  );
}

function HomeFrame() {
  return (
    <section className={phoneFrameClass} aria-label="طرح صفحه اول">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#fffaf1_0%,#f7f1e8_44%,#efe6d8_100%)]" />
      <div className="relative flex h-full flex-col px-5 pb-5 pt-6">
        <header className="flex items-start justify-between">
          <BrandMark />
          <span className="rounded-full border border-[#dbcbb6] bg-white/46 px-3 py-1.5 text-[11px] text-[#6d665d]">ورود</span>
        </header>

        <div className="flex flex-1 flex-col justify-center gap-5">
          <div className="space-y-3">
            <h1 className="text-display text-[2.45rem] leading-[1.24] text-[#171411]">
              محصولت را لوکس نشان بده
            </h1>
            <p className="max-w-[27ch] text-sm leading-7 text-[#6d665d]">
              عکس معمولی را به تصویر تمیز و آماده فروش تبدیل کن.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.65rem] border border-[#decfba] bg-white shadow-[0_28px_55px_-44px_rgba(23,20,17,0.72)]">
            <BeforeAfterHero />
          </div>

          <div className="space-y-3">
            <PrimaryButton>
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              ورود
            </PrimaryButton>
            <p className="text-center text-xs text-[#6d665d]">
              حساب داری؟ <span className="inline-flex items-center gap-1 font-semibold text-[#171411]">ورود <ArrowLeft aria-hidden="true" className="h-4 w-4" /></span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthFrame({ kind }: { kind: "login" | "signup" }) {
  const isSignup = kind === "signup";

  return (
    <section className={phoneFrameClass} aria-label={isSignup ? "طرح ثبت نام" : "طرح ورود"}>
      <div className="absolute inset-0 bg-[#f7f1e8]" />
      <div className="absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <Image src={archiveItems[4].src} alt={archiveItems[4].alt} fill priority className="object-cover object-[48%_52%]" sizes="393px" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,20,17,0.16)_0%,rgba(247,241,232,0)_46%,#f7f1e8_100%)]" />
      </div>

      <div className="relative flex h-full flex-col px-5 pb-6 pt-7">
        <header className="flex items-start justify-between">
          <BrandMark light />
          <span className="rounded-full bg-white/72 px-3 py-1.5 text-[11px] font-medium text-[#554d43] backdrop-blur">
            {isSignup ? "ورود" : "ساخت حساب"}
          </span>
        </header>

        <div className="mt-auto">
          <div className="mb-5 space-y-2">
            <h1 className="text-display text-[2.25rem] leading-[1.25] text-[#171411]">{isSignup ? "ساخت حساب" : "ورود"}</h1>
            <p className="text-xs text-[#7c7163]">{isSignup ? "شروع سریع با ایمیل یا موبایل" : "ادامه بده"}</p>
          </div>

          <div className="rounded-[1.55rem] border border-white/72 bg-[#fffdf9]/84 p-4 shadow-[0_24px_60px_-42px_rgba(23,20,17,0.78)] backdrop-blur-xl">
            <div className="space-y-4">
              <SoftField label="ایمیل/موبایل" icon={<Mail aria-hidden="true" className="h-4 w-4" />} />
              <SoftField label="رمز عبور" icon={<LockKeyhole aria-hidden="true" className="h-4 w-4" />} />
              <PrimaryButton>
                {isSignup ? <UserPlus aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                ورود
              </PrimaryButton>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-[#6d665d]">
            {isSignup ? "قبلا حساب داری؟" : "حساب نداری؟"}{" "}
            <span className="inline-flex items-center gap-1 font-semibold text-[#171411]">
              {isSignup ? "ورود" : "ساخت حساب"}
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

export default function AuthRebuildDesignPage() {
  return (
    <main className="min-h-screen bg-[#e9dfcf] px-6 py-8 text-[#171411]">
      <div className="mx-auto max-w-[1320px] space-y-6">
        <header className="flex flex-col gap-2 text-right sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-[#8b775a]">OVALA UI/UX Rebuild Concept</p>
            <h1 className="text-2xl font-semibold">Home / Login / Signup</h1>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#6d665d]">
            طرح آزمایشی برای review قبل از کدنویسی نهایی. هر فریم اندازه موبایل ۳۹۳×۸۵۲ دارد.
          </p>
        </header>

        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-6">
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">Home</p>
              <HomeFrame />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">Login</p>
              <AuthFrame kind="login" />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">Signup</p>
              <AuthFrame kind="signup" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
