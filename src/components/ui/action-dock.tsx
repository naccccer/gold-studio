import type { HTMLAttributes, ReactNode } from "react";

type ActionDockProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  columns?: 1 | 2;
  sticky?: boolean;
  fade?: boolean;
};

export function ActionDock({ children, columns = 1, sticky = false, fade = true, className = "", ...props }: ActionDockProps) {
  return (
    <div
      className={[
        "motion-reveal-soft",
        sticky && fade
          ? "sticky bottom-[4.45rem] z-20 mx-1 mt-auto bg-gradient-to-t from-background via-background/95 to-transparent pb-2 pt-5"
          : sticky
            ? "sticky bottom-[4.45rem] z-20 mx-1 mt-auto pb-2 pt-5"
            : "mt-auto pb-3",
        columns === 2 ? "grid grid-cols-2 gap-3" : "grid gap-3",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
