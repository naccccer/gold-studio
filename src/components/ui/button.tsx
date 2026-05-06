import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "admin";
type ButtonSize = "sm" | "md" | "full";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-surface shadow-[0_20px_34px_-28px_rgba(17,16,14,0.85)] hover:bg-[#27231f]",
  secondary: "border border-border bg-surface/68 text-foreground hover:border-border-strong hover:bg-surface/90",
  ghost: "text-muted hover:bg-surface-soft hover:text-foreground",
  admin: "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  full: "h-12 w-full px-5 text-sm",
};

export function buttonClasses({ variant = "primary", size = "md", className = "" }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition disabled:opacity-60 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
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
