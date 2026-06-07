import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: "phone" | "md" | "tablet" | "lg" | "wide";
  minHeight?: boolean;
  bare?: boolean;
  className?: string;
};

const maxWidthClasses: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  phone: "max-w-[420px]",
  md: "max-w-[420px]",
  lg: "max-w-[420px]",
  tablet: "max-w-[640px]",
  wide: "max-w-[960px]",
};

export function PageShell({
  children,
  maxWidth = "phone",
  minHeight = true,
  bare = false,
  className,
}: PageShellProps) {
  return (
    <section
      className={cn(
        "ov-fade-in mx-auto flex w-full flex-col",
        maxWidthClasses[maxWidth],
        minHeight && "min-h-[calc(100dvh-7rem)]",
        bare ? "" : "px-[var(--page-x)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
