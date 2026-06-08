import type { HTMLAttributes, ReactNode } from "react";

type ActionDockProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  columns?: 1 | 2;
  sticky?: boolean;
  fade?: boolean;
  tone?: "light" | "dark";
};

export function ActionDock({ children, columns = 1, sticky = false, fade = true, tone = "light", className = "", ...props }: ActionDockProps) {
  const isDark = tone === "dark";
  const baseSticky = isDark
    ? "relative z-20 -mx-[var(--page-x)] mt-auto shrink-0 bg-gradient-to-t from-ink-1 via-ink-1/95 to-transparent px-[var(--page-x)] pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-5"
    : sticky && fade
      ? "sticky bottom-[4.45rem] z-20 mx-1 mt-auto bg-gradient-to-t from-background via-background/95 to-transparent pb-2 pt-5"
      : sticky
        ? "sticky bottom-[4.45rem] z-20 mx-1 mt-auto pb-2 pt-5"
        : "mt-auto pb-3";
  return (
    <div
      className={[
        "ov-fade-in",
        baseSticky,
        columns === 2 ? "grid grid-cols-2 gap-3" : "grid gap-3",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
