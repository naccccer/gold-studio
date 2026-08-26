import type { ReactNode } from "react";
import Link from "next/link";

/*
 * کیت رابط کنسول ادمین Ovala.
 * اصول: سفید + سرمه‌ای عمیق، یک کار اصلی در هر صفحه، جدول/فهرست تمیز،
 * ویرایش در پنل‌های متمرکز و موارد پیشرفته پشت Disclosure.
 */

/* ---------- کلاس‌های فرم ---------- */

export const fieldClass =
  "h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy-950 outline-none transition placeholder:text-slate-400 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 disabled:bg-slate-50 disabled:text-slate-400";

/** کنترل فشرده نوار ابزار: عرض ثابت، بدون w-full تا کنار هم در یک ردیف بنشینند. */
export const inlineFieldClass =
  "h-8 shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-navy-950 outline-none transition placeholder:text-slate-400 focus:border-navy-600 focus:ring-2 focus:ring-navy-100";

export const textareaClass =
  "min-h-24 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-7 text-navy-950 outline-none transition placeholder:text-slate-400 focus:border-navy-600 focus:ring-2 focus:ring-navy-100";

export const checkboxClass = "h-4 w-4 rounded accent-navy-800";

export const btnPrimary =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-3.5 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:pointer-events-none disabled:opacity-50";

export const btnSecondary =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-navy-900 transition hover:border-navy-200 hover:bg-navy-25 disabled:pointer-events-none disabled:opacity-50";

export const btnDanger =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-50";

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`grid min-w-0 content-start gap-1.5 text-xs font-medium text-slate-600 ${className}`}>
      {label}
      {children}
      {hint ? <span className="text-[11px] font-normal text-slate-400">{hint}</span> : null}
    </label>
  );
}

/* ---------- سر صفحه ---------- */

export function ConsoleHeader({
  title,
  meta,
  actions,
  backHref,
  backLabel,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        {backHref ? (
          <Link href={backHref} className="mb-1 inline-block text-[11px] font-medium text-slate-400 transition hover:text-navy-800">
            ‹ {backLabel ?? "بازگشت"}
          </Link>
        ) : null}
        <h1 className="truncate text-lg font-semibold leading-8 text-navy-950">{title}</h1>
        {meta ? <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* ---------- نوار وضعیت فشرده (به جای کارت‌های KPI) ---------- */

export type StatTone = "neutral" | "attention" | "danger" | "success";

const statValueTone: Record<StatTone, string> = {
  neutral: "text-navy-950",
  attention: "text-amber-700",
  danger: "text-rose-700",
  success: "text-emerald-700",
};

export function StatBar({ items }: { items: Array<{ label: string; value: ReactNode; tone?: StatTone; href?: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
      {items.map((item) => {
        const body = (
          <span className="inline-flex items-baseline gap-1.5">
            <span className={`text-sm font-semibold tabular-nums ${statValueTone[item.tone ?? "neutral"]}`}>
              {typeof item.value === "number" ? item.value.toLocaleString("fa-IR") : item.value}
            </span>
            <span className="text-[11px] text-slate-500">{item.label}</span>
          </span>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="transition hover:opacity-70">
            {body}
          </Link>
        ) : (
          <span key={item.label}>{body}</span>
        );
      })}
    </div>
  );
}

/* ---------- تب‌ها و فیلترهای لینکی ---------- */

export function TabNav({ tabs }: { tabs: Array<{ href: string; label: string; active?: boolean; count?: number }> }) {
  return (
    <nav className="flex gap-5 overflow-x-auto border-b border-slate-200" aria-label="بخش‌ها">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={[
            "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 pt-1 text-sm transition",
            tab.active
              ? "border-navy-800 font-semibold text-navy-950"
              : "border-transparent text-slate-500 hover:text-navy-900",
          ].join(" ")}
        >
          {tab.label}
          {typeof tab.count === "number" && tab.count > 0 ? (
            <span className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-navy-700">
              {tab.count.toLocaleString("fa-IR")}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

export function SegmentedLinks({ items }: { items: Array<{ href: string; label: string; active?: boolean; count?: number }> }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={[
            "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
            item.active ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-navy-50 hover:text-navy-900",
          ].join(" ")}
        >
          {item.label}
          {typeof item.count === "number" && item.count > 0 ? (
            <span className={`tabular-nums ${item.active ? "text-navy-200" : "text-slate-400"}`}>
              {item.count.toLocaleString("fa-IR")}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

/* ---------- سطح و بخش ---------- */

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>{children}</section>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <h2 className="text-sm font-semibold text-navy-950">{title}</h2>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

/* ---------- جدول ---------- */

export const cellClass = "px-4 py-3 align-middle text-sm text-navy-950";
export const cellMutedClass = "px-4 py-3 align-middle text-xs text-slate-500";

export function ConsoleTable({
  head,
  children,
  empty,
  minWidth = 720,
}: {
  head: ReactNode[];
  children: ReactNode;
  empty?: ReactNode;
  minWidth?: number;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-right" style={{ minWidth }}>
        <thead>
          <tr>
            {head.map((item, index) => (
              <th key={index} className="border-b border-slate-100 px-4 py-2.5 text-right text-[11px] font-medium text-slate-400">
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr+tr>td]:border-t [&>tr+tr>td]:border-slate-100 [&>tr:hover]:bg-navy-25/70">
          {hasRows ? children : null}
        </tbody>
      </table>
      {!hasRows ? <div className="px-4 py-8">{empty ?? <EmptyState />}</div> : null}
    </div>
  );
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 px-1" aria-label="صفحه‌بندی">
      <p className="text-xs text-slate-500">
        صفحه {faNum(page)} از {faNum(totalPages)} · {faNum(totalItems)} مورد
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefForPage(page - 1)} className={`${btnSecondary} active:scale-[0.97]`}>
            صفحه قبل
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={hrefForPage(page + 1)} className={`${btnSecondary} active:scale-[0.97]`}>
            صفحه بعد
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

/* ---------- وضعیت ---------- */

type StatusVariant = "neutral" | "pending" | "success" | "danger" | "accent";

const statusDotColor: Record<StatusVariant, string> = {
  neutral: "bg-slate-300",
  pending: "bg-amber-500",
  success: "bg-emerald-500",
  danger: "bg-rose-500",
  accent: "bg-navy-500",
};

const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  QUEUED: { label: "در صف", variant: "pending" },
  PROCESSING: { label: "در حال پردازش", variant: "pending" },
  COMPLETED: { label: "تکمیل‌شده", variant: "success" },
  FAILED: { label: "ناموفق", variant: "danger" },
  READY: { label: "آماده", variant: "success" },
  ARCHIVED: { label: "آرشیوشده", variant: "neutral" },
  ACTIVE: { label: "فعال", variant: "success" },
  PAUSED: { label: "متوقف", variant: "pending" },
  CANCELED: { label: "لغوشده", variant: "neutral" },
  EXPIRED: { label: "منقضی", variant: "danger" },
  PENDING: { label: "در انتظار", variant: "pending" },
  APPROVED: { label: "تاییدشده", variant: "success" },
  REJECTED: { label: "ردشده", variant: "danger" },
  OPEN: { label: "باز", variant: "pending" },
  ANSWERED: { label: "پاسخ داده‌شده", variant: "accent" },
  CLOSED: { label: "بسته", variant: "neutral" },
  SUCCESS: { label: "موفق", variant: "success" },
  USER: { label: "کاربر", variant: "neutral" },
  ADMIN: { label: "ادمین", variant: "accent" },
  SALES: { label: "فروش", variant: "success" },
  CREDIT_PACK: { label: "بسته اعتبار", variant: "accent" },
  SUBSCRIPTION: { label: "اشتراک", variant: "success" },
  SIGNUP: { label: "ثبت‌نام", variant: "neutral" },
  PURCHASE: { label: "خرید", variant: "success" },
  REFERRAL: { label: "معرفی", variant: "accent" },
  WALLET: { label: "کیف پول", variant: "neutral" },
};

export function StatusDot({ status, label, className = "" }: { status: string; label?: string; className?: string }) {
  const item = statusMap[status] ?? { label: status, variant: "neutral" as const };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-navy-950 ${className}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotColor[item.variant]}`} />
      {label ?? item.label}
    </span>
  );
}

/* ---------- افشای تدریجی ---------- */

export function Disclosure({
  summary,
  children,
  flush = false,
  defaultOpen = false,
  tone = "default",
}: {
  summary: ReactNode;
  children: ReactNode;
  /** بدون قاب؛ برای استفاده داخل Surface موجود */
  flush?: boolean;
  defaultOpen?: boolean;
  tone?: "default" | "danger";
}) {
  const summaryColor = tone === "danger" ? "text-rose-700" : "text-navy-900";
  return (
    <details open={defaultOpen} className={`group min-w-0 ${flush ? "" : "rounded-xl border border-slate-200 bg-white"}`}>
      <summary
        className={`flex cursor-pointer select-none list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium ${summaryColor} [&::-webkit-details-marker]:hidden`}
      >
        <span className="flex min-w-0 items-center gap-2">{summary}</span>
        <span aria-hidden="true" className="shrink-0 text-slate-400 transition-transform duration-200 group-open:-rotate-90">
          ‹
        </span>
      </summary>
      <div className="border-t border-slate-100 p-4">{children}</div>
    </details>
  );
}

/* ---------- فهرست کلید/مقدار ---------- */

export function KeyValueList({ items }: { items: Array<{ label: string; value: ReactNode; dir?: "rtl" | "ltr" }> }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 py-2 text-sm first:pt-0 last:pb-0">
          <dt className="shrink-0 text-xs text-slate-500">{item.label}</dt>
          <dd className="min-w-0 truncate text-left font-medium text-navy-950" dir={item.dir}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- حالت خالی ---------- */

export function EmptyState({ title = "موردی برای نمایش نیست.", children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-1 py-2 text-center">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {children ? <div className="text-xs leading-6 text-slate-400">{children}</div> : null}
    </div>
  );
}

/* ---------- قالب‌بندی ---------- */

export function faNum(value: number) {
  return value.toLocaleString("fa-IR");
}

export function formatAdminDate(date: Date | string | null | undefined) {
  if (!date) return "نامشخص";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatAdminFullDate(date: Date | string | null | undefined) {
  if (!date) return "نامشخص";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatIrr(amount: number, currency = "IRR") {
  return `${amount.toLocaleString("fa-IR")} ${currency === "IRR" ? "ریال" : currency}`;
}
