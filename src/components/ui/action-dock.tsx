import type { HTMLAttributes, ReactNode } from "react";

type ActionDockProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  columns?: 1 | 2;
  sticky?: boolean;
};

export function ActionDock({ children, columns = 1, sticky = false, className = "", ...props }: ActionDockProps) {
  return (
    <div
      className={[
        sticky ? "sticky bottom-0 z-20 -mx-4 bg-gradient-to-t from-background via-background/96 to-transparent px-4 pb-4 pt-6" : "mt-auto pb-3",
        columns === 2 ? "grid grid-cols-2 gap-3" : "grid gap-3",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
