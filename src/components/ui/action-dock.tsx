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
        sticky && fade
          ? "sticky bottom-[4.6rem] z-20 mt-auto bg-gradient-to-t from-background via-background/95 to-transparent pb-3 pt-5 md:bottom-0"
          : sticky
            ? "sticky bottom-[4.6rem] z-20 mt-auto pb-3 pt-5 md:bottom-0"
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
