import type { HTMLAttributes, ReactNode } from "react";

type JewelryImageFrameProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  aspect?: "square" | "portrait" | "landscape";
};

const aspectClasses = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[5/4]",
};

export function JewelryImageFrame({ children, className = "", aspect = "square", ...props }: JewelryImageFrameProps) {
  return (
    <div className={["overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-surface shadow-[var(--shadow-soft)]", aspectClasses[aspect], className].join(" ")} {...props}>
      {children}
    </div>
  );
}
