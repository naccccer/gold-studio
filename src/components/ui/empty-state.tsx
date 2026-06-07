import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  media?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-[var(--r-2xl)] bg-champagne-50 text-champagne-500">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="text-[15px] font-bold text-ink-1">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-[20rem] text-[13px] leading-6 text-ink-3">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
