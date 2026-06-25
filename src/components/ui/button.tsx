import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "light" | "download" | "danger" | "ghost" | "studio-primary" | "studio-secondary" | "admin";
type ButtonSize = "sm" | "md" | "full" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground text-surface shadow-[0_18px_34px_-24px_rgba(17,16,14,0.95)] hover:bg-[#27231f]",
  secondary:
    "bg-surface-soft text-foreground shadow-[0_14px_28px_-24px_rgba(17,16,14,0.62),inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-surface",
  light:
    "border border-white bg-white text-[#171411] shadow-[0_18px_30px_-24px_rgba(255,255,255,0.82)] hover:bg-[#fff8ef]",
  download:
    "bg-[#0f6f43] text-white shadow-[0_16px_30px_-22px_rgba(15,111,67,0.95)] hover:bg-[#0b5f39]",
  danger: "bg-[#8f241f] text-white shadow-[0_14px_26px_-20px_rgba(143,36,31,0.85)] hover:bg-[#741b18]",
  ghost: "text-muted hover:bg-surface-soft hover:text-foreground",
  "studio-primary":
    "border border-accent-bright/45 bg-[linear-gradient(135deg,var(--accent-gradient-start)_0%,var(--accent-gradient-mid)_48%,var(--accent-gradient-end)_100%)] !text-studio-control shadow-[var(--shadow-accent-action)] hover:brightness-105",
  "studio-secondary":
    "bg-white/[0.15] !text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_28px_-22px_rgba(0,0,0,0.75)] hover:bg-white/[0.22]",
  admin: "bg-surface-soft text-foreground shadow-[0_12px_24px_-22px_rgba(17,16,14,0.55)] hover:bg-surface",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-sm",
  full: "min-h-12 w-full px-5 text-sm",
  icon: "h-11 w-11 p-0 text-sm",
};

export function buttonClasses({ variant = "primary", size = "md", className = "" }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return [
    "motion-press inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-lg)] font-semibold leading-none disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize };
export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) { return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />; }

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode; variant?: ButtonVariant; size?: ButtonSize };
export function ButtonLink({ href, variant, size, className, children, ...props }: ButtonLinkProps) {
  return <Link href={href} className={buttonClasses({ variant, size, className })} {...props}>{children}</Link>;
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: ButtonVariant;
};

export function IconButton({ label, variant = "secondary", className, type = "button", children, ...props }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} className={buttonClasses({ variant, size: "icon", className: `rounded-full ${className ?? ""}` })} {...props}>
      {children}
    </button>
  );
}
