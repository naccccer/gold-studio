import type { ReactNode } from "react";
import { StatusPill } from "@/components/ui/status-pill";

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
    <section className="rounded-[var(--radius-lg)] border border-border/80 bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-[11px] font-medium text-muted">{eyebrow}</p> : null}
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
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
    <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/55 px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold leading-7 text-foreground">
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
        "grid gap-3 border-b border-border/60 px-1 py-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center",
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
  return <p className="rounded-[var(--radius-md)] bg-surface-soft/55 px-3 py-4 text-sm text-muted">{children}</p>;
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
