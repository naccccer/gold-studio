"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Coin, NotificationBing, TickCircle } from "vuesax-icons-react";
import { AppTopBar } from "@/components/ui/app-top-bar";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";
import { markAllNotificationsReadAction } from "@/features/account/actions";

type MastheadNotification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type DashboardMastheadProps = {
  userLabel: string;
  remainingCredits: number;
  unreadNotificationCount: number;
  recentNotifications: MastheadNotification[];
};

const titles: Array<{ match: (pathname: string) => boolean; title: string; parent?: string }> = [
  { match: (pathname) => pathname === "/projects/new", title: "ابعاد و نوع محصول", parent: "/gallery" },
  { match: (pathname) => pathname.startsWith("/gallery/batches/"), title: "دسته تولید", parent: "/gallery" },
  { match: (pathname) => pathname === "/gallery/crop", title: "کراپ", parent: "/gallery" },
  { match: (pathname) => /^\/gallery\/[^/]+$/.test(pathname), title: "تصویر خام", parent: "/gallery" },
  { match: (pathname) => pathname.startsWith("/gallery"), title: "گالری" },
  { match: (pathname) => /^\/projects\/[^/]+$/.test(pathname), title: "نتیجه", parent: "/projects" },
  { match: (pathname) => pathname === "/projects", title: "پروژه‌ها" },
  { match: (pathname) => pathname === "/account/profile", title: "حساب کاربری", parent: "/account" },
  { match: (pathname) => pathname === "/account/style-references", title: "گالری نمونه‌ها", parent: "/account" },
  { match: (pathname) => pathname === "/account/referral", title: "کد معرفی", parent: "/account" },
  { match: (pathname) => pathname === "/account/security", title: "حساب کاربری", parent: "/account" },
  { match: (pathname) => pathname === "/account/support", title: "پشتیبانی", parent: "/account" },
  { match: (pathname) => pathname === "/account/faq", title: "سوالات پرتکرار", parent: "/account" },
  { match: (pathname) => pathname === "/account/notifications", title: "پیام‌ها", parent: "/account" },
  { match: (pathname) => pathname === "/account/output-settings", title: "تنظیمات خروجی", parent: "/account" },
  { match: (pathname) => pathname === "/account/archive", title: "آرشیو", parent: "/account" },
  { match: (pathname) => pathname === "/account", title: "حساب" },
  { match: (pathname) => pathname === "/billing", title: "پلن‌ها", parent: "/account" },
  { match: () => true, title: "خانه" },
];

function pageContext(pathname: string) {
  return titles.find((item) => item.match(pathname)) ?? titles[titles.length - 1];
}

function CreditBadge({ credits }: { credits: number }) {
  return (
    <Link
      href="/billing"
      aria-label={`اعتبار باقی‌مانده: ${credits.toLocaleString("fa-IR")}`}
      className="inline-flex h-10 shrink-0 items-center rounded-full border border-border bg-surface/70 px-3 text-xs font-semibold text-foreground shadow-[var(--shadow-soft)] transition hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
    >
      <span className="leading-none">{credits.toLocaleString("fa-IR")}</span>
      <Coin aria-hidden={true} className="mr-1.5 h-3.5 w-3.5 text-muted" />
    </Link>
  );
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function NotificationButton({
  unreadCount,
  notifications,
  dark = false,
}: {
  unreadCount: number;
  notifications: MastheadNotification[];
  dark?: boolean;
}) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [locallySeenCount, setLocallySeenCount] = useState(0);
  const localUnreadCount = pathname === "/account/notifications" ? 0 : Math.max(0, unreadCount - locallySeenCount);
  const hasUnread = localUnreadCount > 0;
  const buttonClassName = [
    "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    dark
      ? "border-white/12 bg-white/[0.04] text-white/82 hover:bg-white/[0.08]"
      : "border-border bg-surface/70 text-foreground shadow-[var(--shadow-soft)] hover:bg-surface",
  ].join(" ");

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: Event) {
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutside, true);
    document.addEventListener("focusin", closeOnOutside, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside, true);
      document.removeEventListener("focusin", closeOnOutside, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={hasUnread ? `${localUnreadCount.toLocaleString("fa-IR")} پیام خوانده‌نشده` : "پیام‌ها"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={buttonClassName}
      >
        <NotificationBing aria-hidden={true} className="h-4.5 w-4.5" />
        {hasUnread ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-danger-bright px-1 text-[9px] font-bold leading-none text-white ring-2 ring-surface">
            {localUnreadCount > 9 ? "+۹" : localUnreadCount.toLocaleString("fa-IR")}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={[
            "motion-menu absolute right-0 top-[calc(100%+0.55rem)] z-50 w-[18rem] overflow-hidden rounded-[1.05rem] border text-right shadow-[var(--shadow-menu)]",
            dark ? "border-white/12 bg-[#171411] text-surface" : "border-border bg-surface text-foreground",
          ].join(" ")}
        >
          <div className={["flex items-center justify-between gap-3 px-3.5 py-3", dark ? "border-b border-white/10" : "border-b border-border/70"].join(" ")}>
            <p className="text-sm font-semibold">پیام‌ها</p>
            <div className="flex items-center gap-1.5">
              {hasUnread ? (
                <span className={["rounded-full px-2 py-0.5 text-[10px] font-semibold", dark ? "bg-white/10 text-surface/80" : "bg-accent-wash text-accent-deep"].join(" ")}>
                  {localUnreadCount.toLocaleString("fa-IR")} جدید
                </span>
              ) : null}
              <form action={markAllNotificationsReadAction}>
                <button
                  type="submit"
                  disabled={!hasUnread}
                  onClick={() => setLocallySeenCount(unreadCount)}
                  aria-label="علامت‌گذاری همه پیام‌ها به عنوان خوانده‌شده"
                  className={[
                    "inline-flex h-7 w-7 items-center justify-center rounded-full transition disabled:opacity-40",
                    dark ? "bg-white/[0.07] text-surface/74 hover:bg-white/[0.12]" : "bg-accent-wash text-accent-deep hover:bg-accent-soft",
                  ].join(" ")}
                >
                  <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className={["px-3.5 py-5 text-center text-xs leading-6", dark ? "text-surface/62" : "text-muted"].join(" ")}>
                هنوز پیامی ندارید.
              </p>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href="/account/notifications"
                  onClick={() => {
                    setOpen(false);
                    setLocallySeenCount(unreadCount);
                  }}
                  className={["block px-3.5 py-3 transition", dark ? "hover:bg-white/[0.06]" : "hover:bg-surface-soft/70"].join(" ")}
                >
                  <span className="flex items-start gap-2">
                    {!notification.readAt ? (
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-danger-bright" />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-start justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-semibold">{notification.title}</span>
                        <span className={["shrink-0 rounded-full px-1.5 py-0.5 text-[9px] leading-4", dark ? "bg-white/[0.06] text-surface/48" : "bg-surface-soft text-muted-foreground"].join(" ")}>
                          {formatNotificationDate(notification.createdAt)}
                        </span>
                      </span>
                      <span className={["mt-1 block overflow-hidden whitespace-nowrap text-[11px] leading-5 [mask-image:linear-gradient(to_left,black_72%,transparent_100%)]", dark ? "text-surface/64" : "text-muted"].join(" ")}>
                        {notification.body}
                      </span>
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/account/notifications"
            onClick={() => {
              setOpen(false);
              setLocallySeenCount(unreadCount);
            }}
            className={["block px-3.5 py-3 text-center text-xs font-semibold transition", dark ? "border-t border-white/10 text-accent-soft hover:bg-white/[0.06]" : "border-t border-border/70 text-accent-deep hover:bg-surface-soft/70"].join(" ")}
          >
            همه پیام‌ها
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardMasthead({
  userLabel,
  remainingCredits,
  unreadNotificationCount,
  recentNotifications,
}: DashboardMastheadProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const context = pageContext(pathname);
  const isHome = pathname === "/dashboard";
  const isStudioWizard = pathname === "/projects/new" || pathname === "/gallery/batches/new";
  const isProjectDarkSurface = isStudioWizard || pathname.startsWith("/gallery/batches/") || /^\/projects\/[^/]+$/.test(pathname);
  const showBottomNav = !isProjectDarkSurface;
  const fromBatch = searchParams.get("fromBatch");
  const backHref = fromBatch && /^\/projects\/[^/]+$/.test(pathname) ? `/gallery/batches/${fromBatch}` : context.parent;
  const notificationButton = (
    <NotificationButton
      unreadCount={unreadNotificationCount}
      notifications={recentNotifications}
      dark={isProjectDarkSurface}
    />
  );
  const regularActions = (
    <div dir="rtl" className="flex h-10 min-w-[6.85rem] shrink-0 items-center justify-start gap-2">
      {notificationButton}
      {!isHome && !isProjectDarkSurface ? <CreditBadge credits={remainingCredits} /> : null}
    </div>
  );

  return (
    <>
      {!isStudioWizard ? (
        <AppTopBar
          title={undefined}
          backHref={backHref}
          centeredLogo={isHome}
          framed={!isHome}
          logoVariant={isHome ? "primary" : isProjectDarkSurface ? "mark-light" : "logo"}
          tone={isProjectDarkSurface ? "dark" : "light"}
          action={regularActions}
          className={isHome ? "mb-1 px-4" : isProjectDarkSurface ? "mx-4 mb-3" : "mx-4 mb-4"}
        />
      ) : null}

      <span className="sr-only">{userLabel}</span>

      {showBottomNav ? (
        <MobileTabBar
          tabs={[
            { href: "/dashboard", label: "خانه", icon: "home", match: "exact" },
            { href: "/gallery", label: "گالری", icon: "gallery" },
            { href: "/projects", label: "پروژه‌ها", icon: "projects" },
            { href: "/account", label: "حساب", icon: "account", match: "exact" },
          ]}
          centerAction={{ href: "/projects/new", label: "پروژه جدید" }}
        />
      ) : null}
    </>
  );
}
