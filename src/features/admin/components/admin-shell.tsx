"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight2,
  Box,
  Card,
  Category,
  Gallery,
  Gift,
  Home2,
  Image,
  Lifebuoy,
  Profile2User,
  ShieldTick,
  TickCircle,
} from "vuesax-icons-react";
import { ButtonLink } from "@/components/ui/button";

const navGroups = [
  {
    label: "عملیات",
    items: [
      { href: "/admin", label: "نمای کلی", icon: Home2, exact: true },
      { href: "/admin/health", label: "سلامت سیستم", icon: TickCircle },
      { href: "/admin/audit", label: "Audit", icon: ShieldTick },
    ],
  },
  {
    label: "محصول",
    items: [
      { href: "/admin/users", label: "کاربران", icon: Profile2User },
      { href: "/admin/billing", label: "پرداخت و اعتبار", icon: Card },
      { href: "/admin/projects", label: "پروژه‌ها", icon: Gallery },
      { href: "/admin/assets", label: "دارایی‌ها", icon: Image },
      { href: "/admin/styles", label: "سبک‌ها", icon: Category },
    ],
  },
  {
    label: "رشد و سرویس",
    items: [
      { href: "/admin/ai", label: "عملیات AI", icon: Box },
      { href: "/admin/support", label: "پشتیبانی", icon: Lifebuoy },
      { href: "/admin/referrals", label: "معرف و فروش", icon: Gift },
    ],
  },
];

const titleBySegment: Record<string, string> = {
  admin: "ادمین",
  users: "کاربران",
  billing: "پرداخت و اعتبار",
  projects: "پروژه‌ها",
  assets: "دارایی‌ها",
  references: "رفرنس‌ها",
  styles: "سبک‌ها",
  ai: "عملیات AI",
  support: "پشتیبانی",
  faq: "FAQ",
  referrals: "معرف و فروش",
  health: "سلامت سیستم",
  audit: "Audit",
};

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function breadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    label: titleBySegment[segment] ?? segment,
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));
  return crumbs.length ? crumbs : [{ label: "ادمین", href: "/admin" }];
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const crumbs = breadcrumbs(pathname);

  return (
    <div className="min-h-screen bg-slate-50 text-right text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-slate-800 bg-slate-950 px-4 py-4 text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-l lg:border-slate-800 lg:px-3">
          <div className="flex items-start justify-between gap-3 lg:block">
            <div>
              <p className="text-[11px] font-semibold text-cyan-300">Ovala Console</p>
              <h1 className="mt-1 text-lg font-semibold leading-7 text-white">مرکز عملیات</h1>
              <p className="mt-1 text-xs leading-6 text-slate-400">مدیریت محصول، پرداخت، کیفیت و سرویس</p>
            </div>
            <ButtonLink href="/account" variant="secondary" size="sm" className="min-h-9 rounded-[var(--radius-sm)] border border-slate-700 !bg-slate-900 px-3 text-xs !text-white shadow-none hover:!bg-slate-800 lg:mt-4 lg:w-full">
              <ArrowRight2 aria-hidden="true" className="h-4 w-4" />
              حساب
            </ButtonLink>
          </div>

          <nav className="mt-4 flex gap-3 overflow-x-auto pb-1 lg:block lg:space-y-5 lg:overflow-visible lg:pb-0" aria-label="ناوبری ادمین">
            {navGroups.map((group) => (
              <section key={group.label} className="min-w-[210px] lg:min-w-0">
                <p className="mb-2 px-2 text-[11px] font-semibold text-slate-500">{group.label}</p>
                <div className="grid gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          "inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold transition",
                          active ? "bg-white text-slate-950" : "text-slate-400 hover:bg-slate-900 hover:text-white",
                        ].join(" ")}
                      >
                        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
              <nav className="flex min-w-0 items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
                {crumbs.map((crumb, index) => (
                  <span key={crumb.href} className="inline-flex items-center gap-1">
                    {index > 0 ? <span className="text-slate-300">/</span> : null}
                    <Link href={crumb.href} className={index === crumbs.length - 1 ? "font-semibold text-slate-950" : "hover:text-slate-950"}>
                      {crumb.label}
                    </Link>
                  </span>
                ))}
              </nav>
              <div className="text-[11px] font-semibold text-slate-500">RTL / فارسی / عملیات</div>
            </div>
          </header>
          <main className="min-w-0 space-y-4 px-4 py-4 pb-12 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
