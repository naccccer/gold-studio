import { BadgeCheck, CreditCard, Shield, User } from "lucide-react";
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

  return (
    <PageShell maxWidth="md" className="space-y-5">
      <section className="rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-soft text-foreground">
            <User aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground">{name || "کاربر Gold Studio"}</h2>
            <p className="truncate text-xs text-muted" dir="ltr">
              {email}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft text-foreground">
            <CreditCard aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">دسترسی و اشتراک</h2>
              <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-[10px] text-muted">
                آماده اتصال پرداخت
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-muted">
              حساب شما برای نسخه آزمایشی فعال است. بخش اشتراک برای اتصال به درگاه پرداخت ایرانی آماده شده و فعلا مانع ساخت پروژه نمی‌شود.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <BadgeCheck aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.7} />
              <span>اعتبار فعلی: {credits.toLocaleString("fa-IR")}</span>
            </div>
          </div>
        </div>
      </section>

      {isAdmin ? (
        <section className="space-y-3 rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft text-foreground">
              <Shield aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground">مدیریت</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                پنل مدیریت جدا از جریان کاربر نگه داشته شده تا تجربه ساخت تصویر خلوت بماند.
              </p>
              <ButtonLink href="/admin" variant="admin" size="full" className="mt-3">
                <Shield aria-hidden="true" className="h-4 w-4" />
                ورود به مدیریت
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[1.25rem] border border-border/70 bg-surface px-4 py-4">
        <LogoutButton />
      </section>
    </PageShell>
  );
}
