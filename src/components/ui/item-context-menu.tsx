"use client";

import { More } from "vuesax-icons-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ItemContextMenuProps = {
  label: string;
  children: ReactNode;
  align?: "left" | "right";
  tone?: "light" | "dark";
};

export function ItemContextMenu({ label, children, align = "left", tone = "dark" }: ItemContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateMenuPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const menuWidth = 208;
    const gap = 8;
    const viewportPadding = 12;
    const preferredLeft = align === "left" ? rect.left : rect.right - menuWidth;
    const left = Math.min(Math.max(preferredLeft, viewportPadding), window.innerWidth - menuWidth - viewportPadding);
    const top = Math.min(rect.bottom + gap, window.innerHeight - viewportPadding);

    setMenuPosition({ top, left });
  }, [align]);

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();

    function closeOnOutside(event: PointerEvent) {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  const buttonTone =
    tone === "dark"
      ? "border-white/22 bg-black/42 text-surface backdrop-blur hover:bg-black/58"
      : "border-border bg-surface/92 text-foreground shadow-[var(--shadow-soft)] backdrop-blur hover:bg-surface";

  return (
    <div
      ref={wrapperRef}
      className="relative z-20"
      dir="rtl"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] ${buttonTone}`}
      >
        <More aria-hidden={true} className="h-4 w-4" />
      </button>
      {open && menuPosition ? createPortal(
        <div
          ref={menuRef}
          dir="rtl"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          style={{ top: menuPosition.top, left: menuPosition.left }}
          className={[
            "fixed z-50 w-52 overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-surface p-1.5 text-right text-xs text-foreground shadow-[var(--shadow-menu)]",
          ].join(" ")}
        >
          {children}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

export const contextMenuItemClasses =
  "flex min-h-11 w-full items-center justify-start gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-right text-xs font-semibold text-foreground transition hover:bg-surface-soft focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]";

export const contextMenuDangerItemClasses =
  "flex min-h-11 w-full items-center justify-start gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-right text-xs font-semibold text-danger transition hover:bg-danger-soft focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]";
