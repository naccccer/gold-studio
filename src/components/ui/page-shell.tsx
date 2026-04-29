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
    <section
      className={[
        "mx-auto w-full px-4 pb-10 pt-4 sm:px-6 sm:pb-14 sm:pt-6",
        maxWidthClasses[maxWidth],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="space-y-6 sm:space-y-8">{children}</div>
    </section>
  );
}
