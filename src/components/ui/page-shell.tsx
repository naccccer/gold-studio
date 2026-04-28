import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: "md" | "lg";
  className?: string;
};

const maxWidthClasses: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  md: "max-w-3xl",
  lg: "max-w-4xl",
};

export function PageShell({ children, maxWidth = "md", className = "" }: PageShellProps) {
  return (
    <section className={["mx-auto w-full space-y-5 sm:space-y-6", maxWidthClasses[maxWidth], className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}
