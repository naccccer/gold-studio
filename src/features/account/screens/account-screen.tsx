import { BadgeCheck, CircleHelp, Coins, CreditCard, Shield, Sparkles, User } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { LogoutButton } from "@/features/auth/components/logout-button";

type AccountScreenProps = {
  name: string | null;
  email: string;
  role: string;
  credits: number;
};

export function AccountScreen({ name, email, role, credits }: AccountScreenProps) {
  const isAdmin = role === "ADMIN";
  const displayName = name || "کاربر OVALA";

  return (
    <PageShell maxWidth="md" className="space-y-4">
      <section className="overflow-hidden rounded-[1.45rem] border border-border/70 bg-[linear-gradient(145deg,#fffdf9_0%,#f3eadc_100%)] shadow-[var(--shadow-soft)]">
        <div className="px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground">
                <User aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-foreground">{displayName}</h2>
                <p className="truncate text-xs text-muted" dir="ltr">
                  {email}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-border/70 bg-surface/80 px-2.5 py-1 text-[10px] text-muted">
              {isAdmin ? "مدیر" : "عضو"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-[1rem] border border-border/65 bg-surface/72 px-3 py-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                <Coins aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
                اعتبار
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">{credits.toLocaleString("fa-IR")}</p>
            </div>
            <div className="rounded-[1rem] border border-border/65 bg-surface/72 px-3 py-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
                دسترسی
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">فعال</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.7} />
            <h2 className="text-sm font-semibold text-foreground">اشتراک</h2>
          </div>
          <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[10px] text-muted">آزمایشی</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-[0.95rem] bg-surface-soft/70 px-3 py-3 text-muted">
            <p>پرداخت</p>
            <p className="mt-1 font-medium text-foreground">به‌زودی</p>
          </div>
          <div className="rounded-[0.95rem] bg-surface-soft/70 px-3 py-3 text-muted">
            <p>ساخت پروژه</p>
            <p className="mt-1 font-medium text-foreground">باز</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {isAdmin ? (
          <ButtonLink href="/admin" variant="secondary" size="full" className="h-12">
            <Shield aria-hidden="true" className="h-4 w-4" />
            مدیریت
          </ButtonLink>
        ) : null}
        <ButtonLink href="/projects/new" variant="secondary" size="full" className="h-12">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          پروژه جدید
        </ButtonLink>
        <div className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface text-sm font-medium text-muted">
          <CircleHelp aria-hidden="true" className="h-4 w-4" />
          پشتیبانی
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <LogoutButton />
      </section>
    </PageShell>
  );
}
