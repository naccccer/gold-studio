"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "champagne"
  | "dark"
  | "glass"
  | "light"
  | "studio-primary"
  | "studio-secondary"
  | "admin";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "full" | "icon" | "icon-sm" | "icon-lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-1 text-surface shadow-[var(--shadow-md)] hover:bg-ink-2",
  secondary:
    "bg-surface text-ink-1 border border-border shadow-[var(--shadow-xs)] hover:bg-surface-soft hover:border-border-strong",
  ghost:
    "bg-transparent text-ink-2 hover:bg-surface-soft hover:text-ink-1",
  outline:
    "bg-transparent text-ink-1 border border-border-strong hover:bg-surface-soft",
  danger:
    "bg-danger-bright text-white shadow-[var(--shadow-sm)] hover:bg-danger",
  champagne:
    "bg-gradient-to-b from-champagne-300 to-champagne-500 text-champagne-ink shadow-[var(--shadow-gold)] hover:from-champagne-200 hover:to-champagne-400",
  dark:
    "bg-ink-1 text-surface shadow-[var(--shadow-lg)] hover:bg-ink-2",
  glass:
    "bg-surface/70 backdrop-blur-md text-ink-1 border border-border-hairline shadow-[var(--shadow-sm)] hover:bg-surface/90",
  light:
    "bg-surface text-ink-1 border border-border-hairline shadow-[var(--shadow-xs)] hover:bg-surface-soft",
  "studio-primary":
    "bg-gradient-to-b from-champagne-300 to-champagne-500 text-champagne-ink shadow-[var(--shadow-gold)] hover:from-champagne-200 hover:to-champagne-400",
  "studio-secondary":
    "bg-white/10 text-surface border border-white/15 hover:bg-white/20",
  admin:
    "bg-ink-1 text-surface border border-ink-1/10 shadow-[var(--shadow-md)] hover:bg-ink-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-[12px] gap-1.5 rounded-[var(--r-sm)]",
  sm: "h-10 px-4 text-[13px] gap-1.5 rounded-[var(--r-md)]",
  md: "h-12 px-5 text-sm gap-2 rounded-[var(--r-md)]",
  lg: "h-14 px-6 text-[15px] gap-2 rounded-[var(--r-lg)]",
  xl: "h-16 px-7 text-base gap-2.5 rounded-[var(--r-lg)]",
  full: "h-12 w-full px-5 text-sm gap-2 rounded-[var(--r-md)]",
  icon: "h-11 w-11 rounded-[var(--r-md)]",
  "icon-sm": "h-9 w-9 rounded-[var(--r-sm)]",
  "icon-lg": "h-12 w-12 rounded-[var(--r-lg)]",
};

export type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
  fullWidth = false,
}: ButtonClassOptions = {}) {
  return cn(
    "ov-press inline-flex shrink-0 items-center justify-center font-semibold leading-none whitespace-nowrap",
    "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
    "disabled:opacity-50 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<ButtonClassOptions, "className"> & { className?: string };

export function Button({
  variant,
  size,
  className,
  fullWidth,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className, fullWidth })}
      {...props}
    />
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  Omit<ButtonClassOptions, "className"> & {
    href: string;
    children: ReactNode;
    className?: string;
  };

export function ButtonLink({
  href,
  variant,
  size,
  className,
  fullWidth,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={buttonClasses({ variant, size, className, fullWidth })}
      {...props}
    >
      {children}
    </Link>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<ButtonClassOptions, "size"> & {
    label: string;
    size?: ButtonSize;
  };

export function IconButton({
  label,
  variant = "secondary",
  size = "icon",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
