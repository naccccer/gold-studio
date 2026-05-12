import type { ReactNode } from "react";
import { StatusPill } from "@/components/ui/status-pill";

export const adminInputClass =
  "h-9 w-full min-w-0 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-focus focus:shadow-[var(--shadow-focus)]";

export const adminCompactInputClass =
  "h-8 w-full min-w-0 rounded-[var(--radius-xs)] border border-border bg-surface px-2.5 text-xs text-foreground outline-none transition placeholder:text-muted-foreground focus:border-focus focus:shadow-[var(--shadow-focus)]";

export const adminTextareaClass =
  "min-h-24 w-full min-w-0 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm leading-7 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-focus focus:shadow-[var(--shadow-focus)]";

export const adminLabelClass = "grid min-w-0 gap-1.5 text-xs font-medium text-muted";

export const adminPrimaryActionClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-foreground px-3 text-xs font-medium text-surface transition hover:bg-primary-hover";

export const adminSecondaryActionClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-xs font-medium text-foreground transition hover:border-border-strong hover:bg-surface-soft";

export const adminDangerActionClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-danger/30 bg-danger-soft px-3 text-xs font-semibold text-danger transition hover:border-danger";

export function AdminSection({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="h-full rounded-[var(--radius-lg)] border border-border/80 bg-surface p-3 shadow-[var(--shadow-soft)] md:p-3.5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-border/55 pb-2.5">
        <div>
          {eyebrow ? <p className="text-[11px] font-medium leading-5 text-muted">{eyebrow}</p> : null}
          <h2 className="text-sm font-semibold leading-6 text-foreground md:text-[15px]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AdminMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/55 px-3 py-2">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="mt-0.5 truncate text-lg font-semibold leading-7 text-foreground">
        {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function AdminRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        "grid gap-2.5 border-b border-border/60 px-1 py-2.5 text-sm last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function EmptyAdminState({ children }: { children: ReactNode }) {
  return <p className="rounded-[var(--radius-md)] bg-surface-soft/55 px-3 py-3 text-sm text-muted">{children}</p>;
}

export function AdminStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "neutral" | "pending" | "completed" | "failed" }> = {
    QUEUED: { label: "در صف", variant: "pending" },
    PROCESSING: { label: "در حال پردازش", variant: "pending" },
    COMPLETED: { label: "تکمیل‌شده", variant: "completed" },
    FAILED: { label: "ناموفق", variant: "failed" },
    ACTIVE: { label: "فعال", variant: "completed" },
    PAUSED: { label: "متوقف", variant: "pending" },
    CANCELED: { label: "لغوشده", variant: "neutral" },
    EXPIRED: { label: "منقضی", variant: "failed" },
    PENDING: { label: "در انتظار", variant: "pending" },
    APPROVED: { label: "تاییدشده", variant: "completed" },
    REJECTED: { label: "ردشده", variant: "failed" },
    USER: { label: "کاربر", variant: "neutral" },
    ADMIN: { label: "ادمین", variant: "completed" },
  };
  const item = map[status] ?? { label: status, variant: "neutral" as const };
  return <StatusPill variant={item.variant}>{item.label}</StatusPill>;
}

export function formatAdminDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatIrr(amount: number, currency = "IRR") {
  return `${amount.toLocaleString("fa-IR")} ${currency === "IRR" ? "ریال" : currency}`;
}
