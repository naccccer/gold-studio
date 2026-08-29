"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminImageLightbox } from "@/features/admin/components/admin-image-lightbox";
import {
  ArrowRight2,
  ArchiveBook,
  Box,
  Card,
  Category,
  Gallery,
  Gift,
  Home2,
  Image,
  Lifebuoy,
  MessageQuestion,
  NotificationBing,
  Profile2User,
  ShieldTick,
  TickCircle,
} from "vuesax-icons-react";

const navGroups = [
  {
    label: "عملیات",
    items: [
      { href: "/admin", label: "نمای کلی", icon: Home2, exact: true },
      { href: "/admin/projects", label: "پروژه‌ها", icon: Gallery },
      { href: "/admin/quality-reviews", label: "بررسی کیفیت", icon: MessageQuestion },
      { href: "/admin/billing", label: "مالی و پرداخت", icon: Card },
      { href: "/admin/support", label: "پشتیبانی", icon: Lifebuoy },
      { href: "/admin/notifications", label: "پیام‌ها", icon: NotificationBing },
    ],
  },
  {
    label: "محصول",
    items: [
      { href: "/admin/users", label: "کاربران", icon: Profile2User },
      { href: "/admin/home", label: "خانه اپ", icon: Home2 },
      { href: "/admin/styles", label: "سبک‌ها", icon: Category },
      { href: "/admin/assets", label: "تصاویر", icon: Image },
      { href: "/admin/referrals", label: "معرفی و فروش", icon: Gift },
    ],
  },
  {
    label: "سیستم",
    items: [
      { href: "/admin/ai", label: "موتور AI", icon: Box },
      { href: "/admin/health", label: "سلامت", icon: TickCircle },
      { href: "/admin/audit", label: "ردپای تغییرات", icon: ShieldTick },
      { href: "/admin/backups", label: "پشتیبان‌گیری", icon: ArchiveBook },
    ],
  },
];

const titleBySegment: Record<string, string> = {
  admin: "ادمین",
  users: "کاربران",
  home: "خانه اپ",
  billing: "مالی و پرداخت",
  projects: "پروژه‌ها",
  "quality-reviews": "بررسی کیفیت",
  notifications: "پیام‌ها",
  assets: "تصاویر",
  references: "عکس‌های نمونه",
  samples: "نمونه‌های آماده",
  outputs: "خروجی‌ها",
  styles: "سبک‌ها",
  ai: "موتور AI",
  support: "پشتیبانی",
  faq: "پرسش‌های پرتکرار",
  referrals: "معرفی و فروش",
  health: "سلامت",
  audit: "ردپای تغییرات",
  backups: "پشتیبان‌گیری",
};

const salesAllowedHrefs = new Set(["/admin/billing", "/admin/users", "/admin/referrals"]);

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function breadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    label: titleBySegment[segment] ?? segment,
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));
}

export function AdminShell({ children, role }: { children: React.ReactNode; role: "ADMIN" | "SALES" }) {
  const pathname = usePathname();
  const crumbs = breadcrumbs(pathname);
  const visibleGroups =
    role === "ADMIN"
      ? navGroups
      : navGroups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => salesAllowedHrefs.has(item.href)),
          }))
          .filter((group) => group.items.length > 0);

  return (
    <div data-admin-console className="min-h-screen bg-navy-25 text-right text-navy-950">
      <AdminImageLightbox />
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <aside className="hidden w-56 shrink-0 flex-col bg-navy-950 px-3 py-5 lg:flex lg:sticky lg:top-0 lg:h-screen">
          <Link href="/admin" className="px-2.5">
            <span className="block text-base font-bold leading-7 text-white">اوالا</span>
            <span className="block text-[11px] text-navy-300">پنل ادمین</span>
          </Link>

          <nav className="mt-6 flex-1 space-y-5" aria-label="ناوبری ادمین">
            {visibleGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-2.5 text-[10px] font-medium text-navy-500">{group.label}</p>
                <div className="grid gap-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "inline-flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition",
                          active ? "bg-white/10 font-semibold text-white" : "text-navy-200/80 hover:bg-white/5 hover:text-white",
                        ].join(" ")}
                      >
                        <Icon aria-hidden="true" className="h-4 w-4 shrink-0 opacity-80" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <Link
            href="/account"
            className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] text-navy-200/80 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowRight2 aria-hidden="true" className="h-4 w-4 shrink-0 opacity-80" />
            بازگشت به حساب
          </Link>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-12 items-center justify-between gap-3 px-4 lg:px-8">
              <nav className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400" aria-label="مسیر صفحه">
                {crumbs.map((crumb, index) => (
                  <span key={crumb.href} className="inline-flex min-w-0 items-center gap-1.5">
                    {index > 0 ? <span aria-hidden="true">/</span> : null}
                    <Link
                      href={crumb.href}
                      className={
                        index === crumbs.length - 1
                          ? "truncate font-semibold text-navy-950"
                          : "shrink-0 transition hover:text-navy-900"
                      }
                    >
                      {crumb.label}
                    </Link>
                  </span>
                ))}
              </nav>
              <Link href="/account" className="text-[11px] font-medium text-slate-400 transition hover:text-navy-900 lg:hidden">
                حساب
              </Link>
            </div>
            <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden" aria-label="ناوبری ادمین موبایل">
              {visibleGroups.flatMap((group) => group.items).map((item) => {
                const active = isActive(pathname, item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-medium transition",
                      active ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-navy-50",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <main data-admin-image-preview-root className="min-w-0 flex-1 space-y-5 px-4 py-6 pb-16 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
