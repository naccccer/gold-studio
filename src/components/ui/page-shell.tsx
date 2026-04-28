import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: "md" | "lg";
  className?: string;
};

const maxWidthClasses: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
};

export function PageShell({ children, maxWidth = "md", className = "" }: PageShellProps) {
  return (
    <section className={["mx-auto w-full", maxWidthClasses[maxWidth], className].filter(Boolean).join(" ")}>
      <div className="rounded-[var(--radius-lg)] border border-border/70 bg-surface px-4 py-5 sm:px-6 sm:py-7">
        <div className="space-y-5 sm:space-y-6">{children}</div>
      </div>
    </section>
  );
}
