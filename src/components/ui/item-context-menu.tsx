"use client";

import * as Popover from "@radix-ui/react-popover";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ItemContextMenuProps = {
  label: string;
  children: ReactNode;
  align?: "start" | "end" | "left" | "right";
  size?: "sm" | "md";
};

export function ItemContextMenu({ label, children, align = "end", size = "md" }: ItemContextMenuProps) {
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const popoverAlign = align === "left" ? "start" : align === "right" ? "end" : align;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "ov-press inline-flex items-center justify-center rounded-[var(--r-pill)]",
            "bg-surface/80 backdrop-blur border border-border-hairline",
            "text-ink-2 hover:text-ink-1 hover:bg-surface",
            "shadow-[var(--shadow-xs)]",
            buttonSize,
          )}
        >
          <MoreHorizontal aria-hidden className={iconSize} strokeWidth={2.2} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align={popoverAlign}
          sideOffset={6}
          dir="rtl"
          className={cn(
            "z-50 min-w-[12rem] rounded-[var(--r-md)] border border-border bg-surface p-1.5",
            "shadow-[var(--shadow-lg)]",
            "data-[state=open]:animate-[ov-fade-in_var(--d-base)_var(--ease-out)]",
          )}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function ContextMenuItem({
  children,
  onSelect,
  danger = false,
  className,
}: {
  children: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  className?: string;
}) {
  return (
    <Popover.Close asChild>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "ov-press flex w-full items-center justify-start gap-2 rounded-[var(--r-sm)]",
          "min-h-10 px-3 text-right text-[13px] font-semibold",
          danger
            ? "text-danger hover:bg-danger-soft"
            : "text-ink-1 hover:bg-surface-soft",
          "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
          className,
        )}
      >
        {children}
      </button>
    </Popover.Close>
  );
}

export function ContextMenuSeparator() {
  return <div className="my-1 h-px bg-border-hairline" role="separator" />;
}

// Backward-compat: legacy classnames for screens still using the old API
export const contextMenuItemClasses = cn(
  "ov-press flex w-full items-center justify-start gap-2 rounded-[var(--r-sm)]",
  "min-h-10 px-3 text-right text-[13px] font-semibold",
  "text-ink-1 hover:bg-surface-soft",
  "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
);

export const contextMenuDangerItemClasses = cn(
  contextMenuItemClasses,
  "text-danger hover:bg-danger-soft",
);
