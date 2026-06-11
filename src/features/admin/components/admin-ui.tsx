import type { ReactNode } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";

export const adminInputClass =
  "h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-950 focus:ring-3 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500";

export const adminCompactInputClass =
  "h-8 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-950 focus:ring-3 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500";

export const adminTextareaClass =
  "min-h-24 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-7 text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-950 focus:ring-3 focus:ring-cyan-100";

export const adminLabelClass = "grid min-w-0 gap-1.5 text-xs font-medium text-slate-600";

export const adminPrimaryActionClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50";

export const adminSecondaryActionClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50";

export const adminDangerActionClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:border-rose-300 disabled:pointer-events-none disabled:opacity-50";

export const adminTableCellClass = "px-3 py-2.5 align-middle";
export const adminTableHeadClass = "px-3 py-2 text-[11px] font-semibold text-slate-500";

export type AdminStatusVariant = "neutral" | "pending" | "completed" | "failed" | "accent";

const statusMap: Record<string, { label: string; variant: AdminStatusVariant }> = {
  QUEUED: { label: "در صف", variant: "pending" },
  PROCESSING: { label: "در حال پردازش", variant: "pending" },
  COMPLETED: { label: "تکمیل‌شده", variant: "completed" },
  FAILED: { label: "ناموفق", variant: "failed" },
  READY: { label: "آماده", variant: "completed" },
  ARCHIVED: { label: "آرشیوشده", variant: "neutral" },
  ACTIVE: { label: "فعال", variant: "completed" },
  PAUSED: { label: "متوقف", variant: "pending" },
  CANCELED: { label: "لغوشده", variant: "neutral" },
  EXPIRED: { label: "منقضی", variant: "failed" },
  PENDING: { label: "در انتظار", variant: "pending" },
  APPROVED: { label: "تاییدشده", variant: "completed" },
  REJECTED: { label: "ردشده", variant: "failed" },
  OPEN: { label: "باز", variant: "pending" },
  ANSWERED: { label: "پاسخ داده‌شده", variant: "accent" },
  CLOSED: { label: "بسته", variant: "neutral" },
  SUCCESS: { label: "موفق", variant: "completed" },
  USER: { label: "کاربر", variant: "neutral" },
  ADMIN: { label: "ادمین", variant: "completed" },
  CREDIT_PACK: { label: "بسته اعتبار", variant: "accent" },
  SUBSCRIPTION: { label: "اشتراک", variant: "completed" },
};

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold leading-8 text-slate-950 md:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminKpiStrip({ children }: { children: ReactNode }) {
  return <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">{children}</section>;
}

export function AdminKpi({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "attention" | "danger" | "success";
}) {
  const toneClass = {
    neutral: "bg-white",
    attention: "bg-cyan-50",
    danger: "bg-rose-50",
    success: "bg-emerald-50",
  }[tone];

  return (
    <div className={`min-w-0 rounded-lg border border-slate-200 px-3 py-2 shadow-sm ${toneClass}`}>
      <p className="truncate text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-lg font-semibold leading-7 text-slate-950">
        {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
      </p>
      {hint ? <p className="mt-1 truncate text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export const AdminMetric = AdminKpi;

export function AdminPanel({
  id,
  title,
  eyebrow,
  description,
  actions,
  action,
  children,
  className = "",
}: {
  id?: string;
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const resolvedActions = actions ?? action;

  return (
    <section id={id} className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title || eyebrow || description || resolvedActions ? (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {eyebrow ? <p className="text-[11px] font-semibold text-slate-500">{eyebrow}</p> : null}
            {title ? <h2 className="text-sm font-semibold leading-6 text-slate-950">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs leading-6 text-slate-600">{description}</p> : null}
          </div>
          {resolvedActions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{resolvedActions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export const AdminSection = AdminPanel;

export function AdminFilterBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function AdminDataTable({
  headers,
  children,
  empty,
}: {
  headers: ReactNode[];
  children: ReactNode;
  empty?: ReactNode;
}) {
  const hasChildren = Boolean(children);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-right text-sm">
        <thead>
          <tr className="bg-slate-50">
            {headers.map((header, index) => (
              <th key={index} className={adminTableHeadClass}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{hasChildren ? children : null}</tbody>
      </table>
      {!hasChildren && empty ? <div className="p-4">{empty}</div> : null}
    </div>
  );
}

export function AdminRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-2 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${className}`}>{children}</div>;
}

export function AdminStatus({ status, className = "" }: { status: string; className?: string }) {
  const item = statusMap[status] ?? { label: status, variant: "neutral" as const };
  return <StatusPill variant={item.variant} className={className}>{item.label}</StatusPill>;
}

export function AdminEmptyState({
  title = "موردی برای نمایش نیست.",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm">
      <p className="font-semibold text-slate-950">{title}</p>
      {children ? <div className="mt-1 text-xs leading-6 text-slate-600">{children}</div> : null}
    </div>
  );
}

export const EmptyAdminState = AdminEmptyState;

export function AdminDescriptionList({ items }: { items: Array<{ label: string; value: ReactNode; dir?: "rtl" | "ltr" }> }) {
  return (
    <dl className="grid gap-2 text-xs sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <dt className="text-slate-500">{item.label}</dt>
          <dd className="mt-1 truncate font-semibold text-slate-950" dir={item.dir}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminTabs({ tabs }: { tabs: Array<{ href: string; label: string; active?: boolean }> }) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm" aria-label="تب‌های ادمین">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={[
            "inline-flex h-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition",
            tab.active ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
          ].join(" ")}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
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
