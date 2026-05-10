import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "studio-primary" | "studio-secondary" | "admin";
type ButtonSize = "sm" | "md" | "full" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-surface shadow-[var(--shadow-button)] hover:bg-[#27231f]",
  secondary: "border border-border bg-surface/72 text-foreground hover:border-border-strong hover:bg-surface",
  danger: "bg-danger-bright text-white shadow-[0_12px_22px_-16px_rgba(217,45,32,0.9)] hover:bg-danger-hover",
  ghost: "text-muted hover:bg-surface-soft hover:text-foreground",
  "studio-primary":
    "border border-[#ffd98f]/45 bg-[linear-gradient(135deg,var(--gold-gradient-start)_0%,var(--gold-gradient-mid)_48%,var(--gold-gradient-end)_100%)] !text-studio-control shadow-[var(--shadow-gold-action)] hover:brightness-105",
  "studio-secondary":
    "border border-white/28 bg-white/[0.08] !text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/42 hover:bg-white/[0.12]",
  admin: "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-sm",
  full: "min-h-12 w-full px-5 text-sm",
  icon: "h-11 w-11 p-0 text-sm",
};

export function buttonClasses({ variant = "primary", size = "md", className = "" }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-lg)] font-semibold leading-none transition disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
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
