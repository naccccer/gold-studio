import Link from "next/link";
import { Plus, Sparkles, ArrowLeft, Coins } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { Pill } from "@/components/ui/pill";
import { ImageFrame } from "@/components/ui/image-frame";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { archiveItems, homeHero, styleSamples } from "@/lib/placeholders/jewelry-images";

export type DashboardRecentProject = {
  id: string;
  title: string | null;
  status: string;
  style: { name: string };
  sourceImageUrl: string;
  resultImageUrl?: string | null;
  createdAt: Date;
};

type DashboardHomeScreenProps = {
  userName?: string | null;
  projectCount: number;
  completedCount: number;
  remainingCredits: number;
  recentProjects: DashboardRecentProject[];
};

function formatRelativeDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "امروز";
  if (diff < 2 * day) return "دیروز";
  if (diff < 7 * day) return `${Math.floor(diff / day)} روز پیش`;
  return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" }).format(date);
}

export function DashboardHomeScreen({
  userName,
  projectCount,
  completedCount,
  remainingCredits,
  recentProjects,
}: DashboardHomeScreenProps) {
  const greeting = userName?.trim() ? `سلام، ${userName}` : "سلام";
  const firstName = userName?.trim()?.split(/\s+/)[0] ?? "";
  const previewItems = recentProjects.length > 0
    ? recentProjects.slice(0, 2).map((p) => ({
        href: `/projects/${p.id}`,
        src: p.resultImageUrl || p.sourceImageUrl,
        title: p.title || "پروژه اخیر",
        meta: formatRelativeDate(p.createdAt),
      }))
    : archiveItems.slice(0, 2).map((item, i) => ({
        href: i === 0 ? "/gallery" : "/projects",
        src: item.src,
        title: i === 0 ? "گالری نمونه‌ها" : "پروژه‌های آماده",
        meta: i === 0 ? "نمونه‌های ذخیره‌شده" : "شروع کنید",
      }));

  return (
    <PageShell maxWidth="phone" className="space-y-5 pb-6">
      <header className="space-y-1 pt-1">
        <p className="text-[12px] font-medium text-ink-3">{greeting.split("،")[0]}</p>
        <h1 className="text-display text-[26px] text-ink-1">
          {firstName || "به استودیو خوش آمدید"}
        </h1>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="اعتبار" value={remainingCredits.toLocaleString("fa-IR")} icon={<Coins className="h-3.5 w-3.5" strokeWidth={2.2} />} tone="champagne" />
        <StatTile label="پروژه‌ها" value={projectCount.toLocaleString("fa-IR")} />
        <StatTile label="آماده" value={completedCount.toLocaleString("fa-IR")} />
      </div>

      <section className="relative overflow-hidden rounded-[var(--r-2xl)] border border-border-hairline bg-surface shadow-[var(--shadow-md)]">
        <ImageFrame aspect="banner" tone="photo" radius="2xl" className="border-0 shadow-none">
          <SafeJewelryImage
            src={homeHero.src}
            fallbackSrc={styleSamples[0].src}
            fallbackAlt={styleSamples[0].alt}
            alt={homeHero.alt}
            fill
            priority
            className="object-cover object-[52%_58%]"
            sizes="(max-width: 768px) 100vw, 420px"
          />
        </ImageFrame>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-1/82 via-ink-1/24 to-transparent p-4 text-surface">
          <div className="flex items-end justify-between gap-2">
            <div className="space-y-1">
              <Pill tone="ink" size="sm" icon={<Sparkles className="h-3 w-3" strokeWidth={2.2} />}>
                پیشنهاد هفته
              </Pill>
              <p className="text-[14px] font-semibold leading-5 text-surface">
                عکس‌های خام را به استودیوی طلا تبدیل کن
              </p>
              <p className="text-[12px] leading-5 text-surface/72">
                با یک کلیک، نور، زمینه و قاب حرفه‌ای می‌گیری.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ButtonLink href="/projects/new" variant="champagne" size="lg" fullWidth>
        <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
        ساخت پروژه جدید
      </ButtonLink>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink-1">آخرین پروژه‌ها</h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-champagne-600 hover:text-champagne-700"
          >
            همه پروژه‌ها
            <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {previewItems.map((item, index) => (
            <Link
              key={item.href + index}
              href={item.href}
              className="group relative block aspect-[5/4] overflow-hidden rounded-[var(--r-lg)] bg-surface-muted"
            >
              <SafeJewelryImage
                src={item.src}
                fallbackSrc={archiveItems[index % archiveItems.length].src}
                fallbackAlt={archiveItems[index % archiveItems.length].alt}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-[var(--d-slow)] group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 50vw, 220px"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-1/72 to-transparent p-2.5">
                <p className="truncate text-[11px] font-semibold text-surface">{item.title}</p>
                <p className="mt-0.5 truncate text-[10px] text-surface/72">{item.meta}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "default" | "champagne";
}) {
  return (
    <div
      className={
        tone === "champagne"
          ? "rounded-[var(--r-lg)] border border-champagne-200 bg-champagne-50 px-3 py-2.5"
          : "rounded-[var(--r-lg)] border border-border bg-surface px-3 py-2.5"
      }
    >
      <div className="flex items-center gap-1 text-[10px] font-semibold text-ink-3">
        {icon ? <span className="text-champagne-600">{icon}</span> : null}
        {label}
      </div>
      <p className="mt-1 text-[18px] font-bold text-ink-1 text-mono">{value}</p>
    </div>
  );
}
