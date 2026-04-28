import type { HTMLAttributes, ReactNode } from "react";
import { Surface } from "@/components/ui/surface";
import { StatusPill } from "@/components/ui/status-pill";

type BaseProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function StudioFrame({ children, className = "", ...props }: BaseProps) {
  return (
    <section className={["mx-auto w-full max-w-5xl px-4 sm:px-6", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </section>
  );
}

export function StudioHero({ children, className = "", ...props }: BaseProps) {
  return (
    <Surface
      as="section"
      tone="contrast"
      radius="xl"
      padding="lg"
      className={["space-y-3 sm:space-y-4", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Surface>
  );
}

export function EditorialSection({ children, className = "", ...props }: BaseProps) {
  return (
    <section className={["space-y-4 sm:space-y-5", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </section>
  );
}

export function ImageStage({ children, className = "", ...props }: BaseProps) {
  return (
    <Surface
      as="section"
      tone="image-stage"
      radius="xl"
      padding="md"
      className={["overflow-hidden", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Surface>
  );
}

export function QuietMeta({ children, className = "", ...props }: BaseProps) {
  return (
    <p className={["quiet-meta", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </p>
  );
}

type PersianStatusProps = {
  children: ReactNode;
  variant?: "neutral" | "pending" | "completed" | "failed";
  className?: string;
};

export function PersianStatus({ children, variant = "neutral", className = "" }: PersianStatusProps) {
  return <StatusPill variant={variant} className={className}>{children}</StatusPill>;
}

export function FloatingActionDock({ children, className = "", ...props }: BaseProps) {
  return (
    <div
      className={[
        "sticky bottom-4 z-10 rounded-[var(--radius-xl)] bg-surface/95 p-2 shadow-[var(--shadow-float)] backdrop-blur-sm ring-1 ring-border-soft",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">{children}</div>
    </div>
  );
}
