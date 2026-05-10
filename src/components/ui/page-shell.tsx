import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: "phone" | "md" | "lg";
  className?: string;
};

const maxWidthClasses: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  phone: "max-w-[425px]",
  md: "max-w-[425px]",
  lg: "max-w-[425px]",
};

export function PageShell({ children, maxWidth = "md", className = "" }: PageShellProps) {
  return (
    <section
      className={[
        "mx-auto flex min-h-[calc(100svh-8.5rem)] w-full flex-col px-4",
        maxWidthClasses[maxWidth],
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </section>
  );
}
