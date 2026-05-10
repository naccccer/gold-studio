import type { ReactNode } from "react";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";

type EmptyStateProps = {
  title: ReactNode;
  children?: ReactNode;
  media?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, children, media, action, className = "" }: EmptyStateProps) {
  return (
    <section className={["space-y-3 text-center", className].filter(Boolean).join(" ")}>
      {media ? (
        <JewelryImageFrame aspect="landscape" treatment="hero" className="h-[218px]">
          {media}
        </JewelryImageFrame>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {children ? <p className="mx-auto max-w-[18rem] text-xs leading-6 text-muted">{children}</p> : null}
      </div>
      {action}
    </section>
  );
}
