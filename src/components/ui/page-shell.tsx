import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: "phone" | "md" | "lg";
  minHeight?: boolean;
  className?: string;
};

const maxWidthClasses: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  phone: "max-w-[425px]",
  md: "max-w-[425px]",
  lg: "max-w-[425px]",
};

export function PageShell({ children, maxWidth = "md", minHeight = true, className = "" }: PageShellProps) {
  return (
    <section
      className={[
        "mx-auto flex w-full flex-col px-4",
        minHeight ? "min-h-[calc(100svh-8.5rem)]" : undefined,
        maxWidthClasses[maxWidth],
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </section>
  );
}
