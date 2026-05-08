import Image from "next/image";
import localFont from "next/font/local";
import {
  archiveItems,
  homeHero,
  resultHeroDark,
  styleSamples,
  uploadPreview,
} from "@/lib/placeholders/jewelry-images";

const kabel = localFont({
  src: [
    { path: "../../../../public/fonts/Kabel/KabelBook.woff2", weight: "400", style: "normal" },
    { path: "../../../../public/fonts/Kabel/Neue Kabel W01 Medium.woff2", weight: "500", style: "normal" },
    { path: "../../../../public/fonts/Kabel/KabelBold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-kabel",
  display: "swap",
});

const vazirmatn = localFont({
  src: [
    { path: "../../../../public/fonts/Vazir-Light-FD.woff2", weight: "300", style: "normal" },
    { path: "../../../../public/fonts/Vazir-Regular-FD.woff2", weight: "400", style: "normal" },
    { path: "../../../../public/fonts/Vazir-Medium-FD.woff2", weight: "500", style: "normal" },
    { path: "../../../../public/fonts/Vazir-Bold-FD.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

const phoneClass =
  "relative h-[852px] w-[393px] shrink-0 overflow-hidden rounded-[2rem] border border-white/70 bg-[#f7f3ea] text-right text-[#11100e] shadow-[0_34px_90px_-58px_rgba(17,16,14,0.72)]";

type IconProps = {
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
};

function VuesaxIcon({ children, className, strokeWidth = 1.6, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

function HomeIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M3.4 11.2 12 4.1l8.6 7.1" />
      <path d="M5.6 10.2v8.1c0 1.1.8 1.9 1.9 1.9h9c1.1 0 1.9-.8 1.9-1.9v-8.1" />
      <path d="M9.7 20.1v-4.3c0-.9.6-1.5 1.5-1.5h1.6c.9 0 1.5.6 1.5 1.5v4.3" />
    </VuesaxIcon>
  );
}

function GalleryIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M7.3 3.8h9.4c2 0 3.5 1.5 3.5 3.5v9.4c0 2-1.5 3.5-3.5 3.5H7.3c-2 0-3.5-1.5-3.5-3.5V7.3c0-2 1.5-3.5 3.5-3.5Z" />
      <path d="m4.2 16 2.3-1.6c.7-.5 1.7-.4 2.3.2l.5.5c.6.6 1.6.7 2.3.2l2.9-2c.7-.5 1.7-.4 2.3.2l3 2.8" />
      <path d="M8.8 9.2h.1" />
    </VuesaxIcon>
  );
}

function ProjectsIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M4.4 7.1c0-1.7 1-2.7 2.7-2.7h3c1.7 0 2.7 1 2.7 2.7v3c0 1.7-1 2.7-2.7 2.7h-3c-1.7 0-2.7-1-2.7-2.7v-3Z" />
      <path d="M11.2 13.9c0-1.7 1-2.7 2.7-2.7h3c1.7 0 2.7 1 2.7 2.7v3c0 1.7-1 2.7-2.7 2.7h-3c-1.7 0-2.7-1-2.7-2.7v-3Z" />
      <path d="M7.6 8.6h2" />
      <path d="M14.4 15.4h2" />
    </VuesaxIcon>
  );
}

function UserIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M12 12.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M19 20.1c0-3.1-3.1-5.2-7-5.2s-7 2.1-7 5.2" />
    </VuesaxIcon>
  );
}

function PlusIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M12 5.4v13.2" />
      <path d="M5.4 12h13.2" />
    </VuesaxIcon>
  );
}

function ChevronLeftIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="m14.7 6.2-5.3 5.3c-.3.3-.3.7 0 1l5.3 5.3" />
    </VuesaxIcon>
  );
}

function ChevronRightIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="m9.3 6.2 5.3 5.3c.3.3.3.7 0 1l-5.3 5.3" />
    </VuesaxIcon>
  );
}

function ArrowLeftIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M14.9 7.1 10 12l4.9 4.9" />
      <path d="M20 12H10.1" />
    </VuesaxIcon>
  );
}

function UploadIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M12 14.4V4.8" />
      <path d="m8.7 8.1 3.3-3.3 3.3 3.3" />
      <path d="M5.1 13.1v2.1c0 3 1.2 4.2 4.2 4.2h5.4c3 0 4.2-1.2 4.2-4.2v-2.1" />
    </VuesaxIcon>
  );
}

function CameraIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M8.6 6.5 9.8 5c.4-.5.8-.7 1.5-.7h1.4c.7 0 1.1.2 1.5.7l1.2 1.5" />
      <path d="M6.9 19.5h10.2c2 0 3.4-1.4 3.4-3.4V9.8c0-2-1.4-3.4-3.4-3.4H6.9c-2 0-3.4 1.4-3.4 3.4v6.3c0 2 1.4 3.4 3.4 3.4Z" />
      <path d="M12 15.7a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
      <path d="M17.3 10h.1" />
    </VuesaxIcon>
  );
}

function MoreIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M12 12h.1" />
      <path d="M17 12h.1" />
      <path d="M7 12h.1" />
    </VuesaxIcon>
  );
}

function CheckIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="m6.2 12.4 3.6 3.6 8-8" />
    </VuesaxIcon>
  );
}

function SparkleIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M13.2 4.8 15 8.7l3.9 1.8-3.9 1.8-1.8 3.9-1.8-3.9-3.9-1.8 3.9-1.8 1.8-3.9Z" />
      <path d="M6.1 14.7 7 16.6l1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9.9-1.9Z" />
    </VuesaxIcon>
  );
}

function DownloadIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M12 4.8v9.4" />
      <path d="m15.3 11-3.3 3.3L8.7 11" />
      <path d="M5.1 14.3v.9c0 3 1.2 4.2 4.2 4.2h5.4c3 0 4.2-1.2 4.2-4.2v-.9" />
    </VuesaxIcon>
  );
}

function RefreshIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M19.3 12a7.3 7.3 0 0 1-12.5 5.2 7.1 7.1 0 0 1-1.9-3.6" />
      <path d="M4.7 12A7.3 7.3 0 0 1 17.2 6.8 7.1 7.1 0 0 1 19 10.2" />
      <path d="M17.5 10.3H20V7.8" />
      <path d="M6.5 13.7H4v2.5" />
    </VuesaxIcon>
  );
}

function MaximizeIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M8.8 4.6H5.9c-.8 0-1.3.5-1.3 1.3v2.9" />
      <path d="M15.2 4.6h2.9c.8 0 1.3.5 1.3 1.3v2.9" />
      <path d="M19.4 15.2v2.9c0 .8-.5 1.3-1.3 1.3h-2.9" />
      <path d="M4.6 15.2v2.9c0 .8.5 1.3 1.3 1.3h2.9" />
    </VuesaxIcon>
  );
}

function ContactIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M6.9 5.4h10.2c1.6 0 2.6 1 2.6 2.6v8c0 1.6-1 2.6-2.6 2.6H6.9c-1.6 0-2.6-1-2.6-2.6V8c0-1.6 1-2.6 2.6-2.6Z" />
      <path d="m5 8.2 5.1 3.7c1.1.8 2.7.8 3.8 0L19 8.2" />
      <path d="M8.3 16.1h3.2" />
    </VuesaxIcon>
  );
}

function LockIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M7.4 10.3V8.2c0-2.6 1.6-4.2 4.6-4.2s4.6 1.6 4.6 4.2v2.1" />
      <path d="M7.2 20h9.6c1.8 0 2.8-1 2.8-2.8v-4.1c0-1.8-1-2.8-2.8-2.8H7.2c-1.8 0-2.8 1-2.8 2.8v4.1C4.4 19 5.4 20 7.2 20Z" />
      <path d="M12 14.2v2" />
    </VuesaxIcon>
  );
}

function EyeIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M3.8 12s2.7-5.3 8.2-5.3 8.2 5.3 8.2 5.3-2.7 5.3-8.2 5.3S3.8 12 3.8 12Z" />
      <path d="M12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" />
    </VuesaxIcon>
  );
}

function ShieldIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M12 21s7-3.1 7-9.2V6.4c0-.8-.5-1.4-1.3-1.7L12 2.8 6.3 4.7C5.5 5 5 5.6 5 6.4v5.4C5 17.9 12 21 12 21Z" />
      <path d="m8.8 12 2.1 2.1 4.5-4.6" />
    </VuesaxIcon>
  );
}

function SettingsIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
      <path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l1.6-1.2-1.7-3-1.9.8c-.8-.6-1.3-.8-2.2-1.1L15 4h-3.5l-.3 2c-.9.3-1.4.5-2.2 1.1l-1.9-.8-1.7 3L7 10.5c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-1.6 1.2 1.7 3 1.9-.8c.8.6 1.3.8 2.2 1.1l.3 2H15l.3-2c.9-.3 1.4-.5 2.2-1.1l1.9.8 1.7-3-1.7-1.2Z" />
    </VuesaxIcon>
  );
}

function LogoutIcon(props: IconProps) {
  return (
    <VuesaxIcon {...props}>
      <path d="M9.6 7.6V6.5c0-1.5.9-2.4 2.4-2.4h4.4c1.5 0 2.4.9 2.4 2.4v11c0 1.5-.9 2.4-2.4 2.4H12c-1.5 0-2.4-.9-2.4-2.4v-1.1" />
      <path d="M4.2 12h10.1" />
      <path d="m6.5 8.8-3.2 3.2 3.2 3.2" />
    </VuesaxIcon>
  );
}

const navItems = [
  { label: "خانه", icon: HomeIcon, active: false },
  { label: "گالری", icon: GalleryIcon, active: false },
  { label: "", icon: PlusIcon, active: true },
  { label: "پروژه‌ها", icon: ProjectsIcon, active: false },
  { label: "حساب", icon: UserIcon, active: false },
];

function BrandLogo({ compact = false, studio = false }: { compact?: boolean; studio?: boolean }) {
  const src = compact ? "/brand/ovala-mark.svg" : studio ? "/brand/ovala-primary.svg" : "/brand/ovala-wordmark.svg";

  return (
    <div className="flex items-center justify-center gap-2" dir="ltr">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="OVALA Studio"
        className={
          compact
            ? "h-8 w-8 object-contain"
            : studio
              ? "h-[58px] w-[174px] translate-x-[10px] translate-y-[4px] object-contain object-center"
              : "h-8 w-[138px] object-contain object-left"
        }
      />
    </div>
  );
}

function PhoneChrome({
  children,
  activeIndex = 0,
  showNav = true,
}: {
  children: React.ReactNode;
  activeIndex?: number;
  showNav?: boolean;
}) {
  return (
    <section className={phoneClass}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-4%,#fffdf9_0%,#f7f3ea_42%,#eee5d8_100%)]" />
      <div className="relative flex h-full flex-col">
        <div className={`flex-1 overflow-hidden px-5 pt-5 ${showNav ? "pb-24" : "pb-5"}`}>{children}</div>
        {showNav ? (
          <nav className="absolute inset-x-0 bottom-0 px-3 pb-3" aria-label="ناوبری نمونه">
            <div className="grid grid-cols-5 items-center rounded-[1.45rem] border border-white/80 bg-[#fffdf9]/94 px-1.5 py-1.5 text-center shadow-[0_22px_55px_-42px_rgba(17,16,14,0.9)] backdrop-blur">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = index === activeIndex;
                const isCenter = index === 2;

                if (isCenter) {
                  return (
                    <div
                      key="center"
                      className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d7bd86] bg-[#c7a96b] text-[#fffdf9] shadow-[0_18px_34px_-22px_rgba(43,33,23,0.9)]"
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                  );
                }

                return (
                  <div
                    key={item.label}
                    className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[1rem] text-[10px] leading-none ${
                      active ? "bg-[#f0e8dc] text-[#11100e]" : "text-[#8b8173]"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.65} />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>
    </section>
  );
}

function TopBar({
  title,
  back = false,
  compactLogo = false,
  centeredLogo = false,
  studioLogo = false,
}: {
  title?: string;
  back?: boolean;
  compactLogo?: boolean;
  centeredLogo?: boolean;
  studioLogo?: boolean;
}) {
  if (centeredLogo) {
    return (
      <header className="mb-4 flex h-[64px] items-center justify-center overflow-hidden">
        <BrandLogo compact={compactLogo} studio={studioLogo} />
      </header>
    );
  }

  return (
    <header className="mb-5 flex h-10 items-center justify-between gap-4">
      <div className="flex items-center justify-end gap-2">
        {back ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd1c0] bg-white/54" aria-label="بازگشت">
            <ChevronRightIcon aria-hidden="true" className="h-4 w-4" />
          </span>
        ) : null}
        {title ? <p className="text-[15px] font-semibold leading-none text-[#2f2a24]">{title}</p> : null}
      </div>
      <BrandLogo compact={compactLogo} studio={studioLogo} />
    </header>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[1rem] bg-[#11100e] px-5 text-sm font-semibold text-[#fffdf9] shadow-[0_20px_34px_-28px_rgba(17,16,14,0.85)]">
      {children}
    </button>
  );
}

function AuthField({
  label,
  value,
  icon: Icon,
  trailing,
  valueDir = "rtl",
}: {
  label: string;
  value: string;
  icon: (props: IconProps) => React.ReactNode;
  trailing?: React.ReactNode;
  valueDir?: "rtl" | "ltr";
}) {
  return (
    <div className="rounded-[1.05rem] border border-white/76 bg-[#fffdf9]/68 px-3.5 py-3 shadow-[0_16px_36px_-34px_rgba(17,16,14,0.65)]">
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[#918575]">
        <span>{label}</span>
        <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold leading-none text-[#24201b] [unicode-bidi:isolate]" dir={valueDir}>
          {value}
        </p>
        {trailing}
      </div>
    </div>
  );
}

function AuthImageBackdrop({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="absolute -inset-x-5 -bottom-5 -top-5">
      <Image src={mode === "login" ? resultHeroDark.src : homeHero.src} alt="" fill priority className="object-cover object-[50%_52%]" sizes="393px" />
      <div className="absolute inset-x-0 bottom-0 h-[360px] bg-gradient-to-t from-[#11100e]/56 via-[#11100e]/18 to-transparent" />
    </div>
  );
}

function LoginScreen() {
  return (
    <PhoneChrome showNav={false}>
      <div className="relative flex h-full flex-col">
        <AuthImageBackdrop mode="login" />
        <div className="relative flex h-[78px] items-center justify-center">
          <BrandLogo studio />
        </div>
        <div className="relative mt-auto space-y-3">
          <AuthField label="موبایل / ایمیل" value="۰۹۱۲ ۴۵۶ ۷۸۹۰" icon={ContactIcon} valueDir="ltr" />
          <AuthField
            label="رمز عبور"
            value="••••••••"
            icon={LockIcon}
            trailing={<EyeIcon aria-hidden="true" className="h-4 w-4 text-[#8b8173]" />}
          />
        </div>
        <div className="relative mt-4 space-y-3 pb-1">
          <PrimaryButton>
            ورود به استودیو
            <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
          </PrimaryButton>
          <div className="flex items-center justify-between text-xs font-medium text-[#6d665d]">
            <span>ثبت‌نام</span>
            <span>فراموشی رمز</span>
          </div>
        </div>
      </div>
    </PhoneChrome>
  );
}

function SignupScreen() {
  return (
    <PhoneChrome showNav={false}>
      <div className="relative flex h-full flex-col">
        <AuthImageBackdrop mode="signup" />
        <div className="relative flex h-[78px] items-center justify-center">
          <BrandLogo studio />
        </div>
        <div className="relative mt-auto space-y-3">
          <AuthField label="موبایل / ایمیل" value="۰۹۱۲ ۴۵۶ ۷۸۹۰" icon={ContactIcon} valueDir="ltr" />
          <AuthField label="کد دعوت" value="اختیاری" icon={ShieldIcon} />
        </div>
        <div className="relative mt-4 space-y-3 pb-1">
          <PrimaryButton>
            ساخت حساب
            <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
          </PrimaryButton>
          <p className="text-center text-[11px] leading-5 text-[#fffdf9]/78">با ادامه، قوانین نگهداری امن تصاویر محصول را می‌پذیری.</p>
        </div>
      </div>
    </PhoneChrome>
  );
}

function HomeScreen() {
  return (
    <PhoneChrome activeIndex={0}>
      <TopBar centeredLogo studioLogo />
      <div className="space-y-5">
        <div className="group relative h-[410px] overflow-hidden rounded-[1.45rem] border border-white/80 bg-[#e9dfcf] shadow-[0_28px_58px_-46px_rgba(17,16,14,0.7)]">
          <Image src={homeHero.src} alt="" fill priority className="animate-[ovalaSlideA_12s_ease-in-out_infinite] object-cover object-[52%_58%]" sizes="393px" />
          <Image src={styleSamples[0].src} alt="" fill className="animate-[ovalaSlideB_12s_ease-in-out_infinite] object-cover object-[50%_55%]" sizes="393px" />
          <Image src={styleSamples[2].src} alt="" fill className="animate-[ovalaSlideC_12s_ease-in-out_infinite] object-cover object-[50%_52%]" sizes="393px" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/66 via-black/12 to-transparent p-4 text-[#fffdf9]">
            <div className="flex items-end justify-between gap-3">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] text-[#fff7e7]">
                <SparkleIcon aria-hidden="true" className="h-3 w-3" />
                پیشنهاد هفته
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-5 rounded-full bg-[#fffdf9]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#fffdf9]/48" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#fffdf9]/48" />
              </div>
            </div>
          </div>
        </div>

        <PrimaryButton>
          <PlusIcon aria-hidden="true" className="h-4 w-4" />
          پروژه جدید
        </PrimaryButton>

        <div className="grid grid-cols-2 gap-3">
          {archiveItems.slice(0, 2).map((item, index) => (
            <div key={item.src} className="relative h-[112px] overflow-hidden rounded-[1rem] bg-[#e8dfd2]">
              <Image src={item.src} alt="" fill className="object-cover" sizes="180px" />
              <span className="absolute bottom-2 right-2 rounded-full bg-[#fffdf9]/84 px-2 py-0.5 text-[10px] font-medium text-[#6d665d] backdrop-blur">
                {index === 0 ? "۱۲ اردیبهشت" : "۹ اردیبهشت"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PhoneChrome>
  );
}

function GalleryScreen() {
  return (
    <PhoneChrome activeIndex={1}>
      <TopBar title="گالری" compactLogo />
      <div className="flex h-[682px] flex-col gap-5">
        <div className="rounded-[1.35rem] border border-dashed border-[#c7a96b] bg-[#fffdf9]/62 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#7b7164]">عکس محصول را اضافه کن</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#efe2cd] text-[#8b6835]">
                <CameraIcon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#efe2cd] text-[#8b6835]">
                <UploadIcon aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[uploadPreview, ...archiveItems.slice(2, 7)].map((item, index) => (
            <div
              key={item.src}
              className={`relative h-[136px] overflow-hidden rounded-[1.08rem] border bg-[#ebe2d6] ${
                index === 0 ? "border-[#c7a96b] shadow-[0_18px_36px_-28px_rgba(17,16,14,0.58)]" : "border-white/72"
              }`}
            >
              <Image src={item.src} alt="" fill className="object-cover" sizes="180px" />
              <span className="absolute bottom-2 left-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#11100e]/48 text-[#fffdf9] opacity-90 backdrop-blur">
                <MoreIcon aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
              {index === 0 ? (
                <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#11100e] text-[#fffdf9]">
                  <CheckIcon aria-hidden="true" className="h-4 w-4" />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-auto pb-3">
          <PrimaryButton>
            ادامه
            <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
          </PrimaryButton>
        </div>
      </div>
    </PhoneChrome>
  );
}

function NewProjectScreen() {
  return (
    <PhoneChrome activeIndex={2}>
      <TopBar title="پروژه جدید" back compactLogo />
      <div className="space-y-4">
        <div className="relative h-[218px] overflow-hidden rounded-[1.45rem] border border-white/80 bg-[#e7ded2]">
          <Image src={uploadPreview.src} alt="" fill priority className="object-cover object-[46%_55%]" sizes="393px" />
          <div className="absolute bottom-3 right-3 rounded-full bg-[#fffdf9]/86 px-3 py-1 text-xs font-medium text-[#554d43] backdrop-blur">
            عکس انتخاب‌شده
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[1rem] border border-white/72 bg-[#fffdf9]/58 p-2 text-center">
          {[
            { name: "پست", ratio: "۱:۱" },
            { name: "استوری", ratio: "۹:۱۶" },
            { name: "بنر", ratio: "۱۶:۹" },
          ].map((item, index) => (
            <span
              key={item.name}
              className={`rounded-[0.8rem] px-2 py-2 text-[11px] font-medium ${
                index === 0 ? "bg-[#11100e] text-[#fffdf9]" : "bg-white/56 text-[#6d665d]"
              }`}
            >
              <span className="block leading-none">{item.name}</span>
              <span className="mt-1 block text-[10px] leading-none opacity-70" dir="ltr">
                {item.ratio}
              </span>
            </span>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">سبک تصویر</p>
            <p className="text-[11px] font-medium text-[#8b8173]">پیشنهاد استودیو</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {styleSamples.slice(0, 4).map((style, index) => (
              <div
                key={style.src}
                className={`overflow-hidden rounded-[1rem] border bg-white/60 ${
                  index === 0 ? "border-[#c7a96b]" : "border-white/72"
                }`}
              >
                <div className="relative h-24">
                  <Image src={style.src} alt="" fill className="object-cover" sizes="180px" />
                </div>
                <p className="px-3 py-2 text-xs font-medium">{["مینیمال روشن", "تیره آرام", "ادیتوریال", "طبیعی"][index]}</p>
              </div>
            ))}
          </div>
        </div>

        <PrimaryButton>
          ساخت تصویر
          <SparkleIcon aria-hidden="true" className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </PhoneChrome>
  );
}

function ProcessingScreen() {
  return (
    <PhoneChrome activeIndex={3}>
      <TopBar title="در حال ساخت" compactLogo />
      <div className="flex h-[682px] flex-col gap-3 pt-3">
        <div className="relative h-[430px] w-full overflow-hidden rounded-[1.6rem] border border-white/80 bg-[#efe7db] shadow-[0_28px_58px_-46px_rgba(17,16,14,0.78)]">
          <Image src={uploadPreview.src} alt="" fill className="scale-[1.04] object-cover object-[48%_54%] opacity-70 blur-[1.5px]" sizes="316px" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,253,249,0.06)_0%,rgba(17,16,14,0.24)_64%,rgba(17,16,14,0.34)_100%)]" />
          <div className="absolute inset-x-10 top-8 h-px animate-[scanLine_3s_ease-in-out_infinite] bg-gradient-to-l from-transparent via-[#fff7e7]/85 to-transparent" />
          <div className="absolute inset-x-8 bottom-8 top-8 rounded-[1.25rem] border border-white/26" />
          <div className="absolute inset-x-12 top-16 flex items-center justify-between text-[#fffdf9]/58">
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="h-2 w-2 rounded-full bg-current" />
          </div>
          <div className="absolute inset-x-12 bottom-16 flex items-center justify-between text-[#fffdf9]/58">
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="h-2 w-2 rounded-full bg-current" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="relative inline-flex h-[74px] w-[74px] items-center justify-center rounded-full border border-white/42 bg-[#11100e]/50 text-[#fffdf9] shadow-[0_20px_44px_-26px_rgba(17,16,14,0.9)] backdrop-blur">
              <span className="absolute -inset-4 animate-[loadingPulse_2.4s_ease-in-out_infinite] rounded-full border border-[#fffdf9]/16" />
              <span className="absolute -inset-8 animate-[loadingPulse_2.4s_ease-in-out_infinite_600ms] rounded-full border border-[#c7a96b]/18" />
              <span className="absolute inset-2 animate-spin rounded-full border border-[#fffdf9]/18 border-t-[#fffdf9]/78" />
              <SparkleIcon aria-hidden="true" className="h-6 w-6" strokeWidth={1.45} />
            </span>
          </div>
        </div>

        <div className="rounded-[1.15rem] border border-white/72 bg-[#fffdf9]/68 p-2.5">
          <div className="relative h-8 overflow-hidden">
            {["تشخیص محصول", "پاک‌سازی زمینه", "ساخت خروجی نهایی"].map((step, index) => (
              <p
                key={step}
                className="absolute inset-0 flex items-center justify-center text-sm font-semibold leading-none text-[#11100e]"
                style={{ animation: `processingStep 6s ease-in-out infinite`, animationDelay: `${index * -2}s`, opacity: 0 }}
              >
                {step}
              </p>
            ))}
          </div>
        </div>

        <div className="flex w-full items-center justify-center gap-2 py-1">
          <span className="h-1.5 w-8 rounded-full bg-[#c7a96b]" />
          <span className="h-1.5 w-8 rounded-full bg-[#c7a96b]/46" />
          <span className="h-1.5 w-8 rounded-full bg-[#c7a96b]/24" />
        </div>

        <div className="mt-auto grid w-full grid-cols-2 gap-3 pb-3">
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-[#11100e] text-sm font-semibold text-[#fffdf9]">
            <PlusIcon aria-hidden="true" className="h-4 w-4" />
            پروژه جدید
          </button>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-[#ddd1c0] bg-white/62 text-sm font-semibold text-[#554d43]">
            <GalleryIcon aria-hidden="true" className="h-4 w-4" />
            بازگشت به گالری
          </button>
        </div>
      </div>
    </PhoneChrome>
  );
}

function ResultScreen() {
  return (
    <PhoneChrome activeIndex={3}>
      <TopBar title="نتیجه پروژه" back compactLogo />
      <div className="flex h-[682px] flex-col gap-4">
        <div className="group relative h-[536px] cursor-zoom-in overflow-hidden rounded-[1.6rem] border border-white/80 bg-[#11100e] shadow-[0_28px_58px_-46px_rgba(17,16,14,0.82)]">
          <Image src={resultHeroDark.src} alt="" fill priority className="object-cover object-[50%_52%]" sizes="393px" />
          <Image
            src={uploadPreview.src}
            alt=""
            fill
            className="object-cover object-[46%_55%] opacity-0 transition duration-300 group-hover:opacity-100 group-active:opacity-100"
            sizes="393px"
          />
          <div className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/28 text-[#fffdf9] backdrop-blur">
            <MaximizeIcon aria-hidden="true" className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 pb-3">
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-[#11100e] text-sm font-semibold text-[#fffdf9]">
            <DownloadIcon aria-hidden="true" className="h-4 w-4" />
            ذخیره
          </button>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-[#ddd1c0] bg-white/62 text-sm font-semibold text-[#11100e]">
            <RefreshIcon aria-hidden="true" className="h-4 w-4" />
            نسخه دیگر
          </button>
        </div>
      </div>
    </PhoneChrome>
  );
}

function AccountRow({
  icon: Icon,
  title,
  caption,
}: {
  icon: (props: IconProps) => React.ReactNode;
  title: string;
  caption: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.05rem] border border-white/72 bg-[#fffdf9]/64 px-3.5 py-2.5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#efe2cd] text-[#8b6835]">
          <Icon aria-hidden="true" className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-5 text-[#24201b]">{title}</p>
          <p className="text-[11px] leading-5 text-[#8b8173]">{caption}</p>
        </div>
      </div>
      <ChevronLeftIcon aria-hidden="true" className="h-4 w-4 text-[#9a8f82]" />
    </div>
  );
}

function AccountScreen() {
  return (
    <PhoneChrome activeIndex={4}>
      <TopBar title="حساب" compactLogo />
      <div className="flex h-[682px] flex-col gap-3">
        <div className="rounded-[1.45rem] border border-white/80 bg-[#fffdf9]/62 p-3.5 shadow-[0_22px_50px_-44px_rgba(17,16,14,0.72)]">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-[1.15rem] bg-[#e8dfd2]">
              <Image src={archiveItems[1].src} alt="" fill className="object-cover" sizes="64px" />
            </div>
            <div>
              <p className="text-base font-semibold text-[#24201b]">گالری آوان</p>
              <p className="mt-1 text-xs font-medium text-[#8b8173]" dir="ltr">
                0912 456 7890
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-[1rem] bg-white/62 px-3 py-2.5">
              <p className="text-[11px] font-medium text-[#8b8173]">اعتبار باقی‌مانده</p>
              <p className="mt-1 text-lg font-semibold text-[#11100e]">۱۲</p>
            </div>
            <div className="rounded-[1rem] bg-white/62 px-3 py-2.5">
              <p className="text-[11px] font-medium text-[#8b8173]">پلن فعلی</p>
              <p className="mt-1 text-sm font-semibold text-[#11100e]">استودیو</p>
            </div>
          </div>
        </div>

        <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[1rem] bg-[#11100e] px-5 text-sm font-semibold text-[#fffdf9] shadow-[0_20px_34px_-28px_rgba(17,16,14,0.85)]">
          <PlusIcon aria-hidden="true" className="h-4 w-4" />
          خرید اعتبار یا اشتراک
        </button>

        <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[1rem] border border-[#d6c29c] bg-[#efe2cd]/72 px-5 text-sm font-semibold text-[#6f542b]">
          <ShieldIcon aria-hidden="true" className="h-4 w-4" />
          ورود به بخش ادمین
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-white/72 bg-[#fffdf9]/64 text-xs font-semibold text-[#554d43]">
            <ContactIcon aria-hidden="true" className="h-4 w-4" />
            پشتیبانی
          </button>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-white/72 bg-[#fffdf9]/64 text-xs font-semibold text-[#554d43]">
            <ShieldIcon aria-hidden="true" className="h-4 w-4" />
            سوالات پرتکرار
          </button>
        </div>

        <div className="space-y-2.5">
          <AccountRow icon={UserIcon} title="مشخصات" caption="نام، موبایل و اطلاعات فروشگاه" />
          <AccountRow icon={PlusIcon} title="دریافت کد معرف" caption="دعوت همکاران و دریافت اعتبار" />
          <AccountRow icon={SettingsIcon} title="تنظیمات خروجی" caption="کیفیت، اندازه و مسیر ذخیره" />
          <AccountRow icon={ShieldIcon} title="امنیت حساب" caption="رمز عبور و نشست‌ها" />
        </div>

        <div className="mt-auto pb-3">
          <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[1rem] border border-[#e3b8ad] bg-[#fff2ef]/78 text-sm font-semibold text-[#9d3f2f]">
            <LogoutIcon aria-hidden="true" className="h-4 w-4" />
            خروج از حساب
          </button>
        </div>
      </div>
    </PhoneChrome>
  );
}

export default function UserFlowDesignPage() {
  return (
    <main
      className={`${kabel.variable} ${vazirmatn.variable} min-h-screen bg-[#e9dfcf] px-6 py-8 font-[var(--font-vazirmatn)] text-[#11100e]`}
      dir="rtl"
    >
      <style>{`
        @keyframes ovalaSlideA {
          0%, 28%, 100% { opacity: 1; transform: scale(1); }
          34%, 94% { opacity: 0; transform: scale(1.03); }
        }
        @keyframes ovalaSlideB {
          0%, 27%, 68%, 100% { opacity: 0; transform: scale(1.03); }
          34%, 61% { opacity: 1; transform: scale(1); }
        }
        @keyframes ovalaSlideC {
          0%, 60%, 100% { opacity: 0; transform: scale(1.03); }
          68%, 94% { opacity: 1; transform: scale(1); }
        }
        @keyframes processingStep {
          0%, 4% { opacity: 0; transform: translateY(10px) scale(.98); }
          10%, 30% { opacity: 1; transform: translateY(0) scale(1); }
          36%, 100% { opacity: 0; transform: translateY(-10px) scale(.98); }
        }
        @keyframes quietAura {
          0%, 100% { opacity: .35; transform: translate3d(44px, -22px, 0); }
          50% { opacity: .76; transform: translate3d(-44px, 22px, 0); }
        }
        @keyframes scanLine {
          0%, 100% { opacity: 0; transform: translateY(0); }
          18%, 70% { opacity: .9; }
          50% { transform: translateY(306px); }
        }
        @keyframes loadingPulse {
          0% { opacity: 0; transform: scale(.72); }
          35% { opacity: .72; }
          100% { opacity: 0; transform: scale(1.24); }
        }
        @keyframes loadingSweep {
          0%, 100% { transform: translateX(120%); opacity: 0; }
          45% { opacity: 1; }
          70% { transform: translateX(-120%); opacity: 0; }
        }
      `}</style>
      <div className="mx-auto max-w-[2320px] space-y-7">
        <header className="flex flex-col gap-3 text-right sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-[var(--font-kabel)] text-xs font-medium text-[#8b775a]">Studio OVALA UI Direction</p>
            <h1 className="text-2xl font-semibold">جریان کامل کاربر</h1>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#6d665d]">
            نمونه قابل بازبینی برای ورود، ثبت‌نام، شروع از خانه، انتخاب عکس خام، ساخت پروژه، پردازش آرام، بازبینی خروجی، و حساب کاربر.
          </p>
        </header>

        <div className="overflow-x-auto pb-5">
          <div className="flex min-w-max gap-6">
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">۱. ورود</p>
              <LoginScreen />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">۲. ثبت‌نام</p>
              <SignupScreen />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">۳. خانه</p>
              <HomeScreen />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">۴. انتخاب عکس</p>
              <GalleryScreen />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">۵. راهنمای ساخت</p>
              <NewProjectScreen />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">۶. پردازش</p>
              <ProcessingScreen />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">۷. نتیجه</p>
              <ResultScreen />
            </div>
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-[#554d43]">۸. حساب</p>
              <AccountScreen />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
