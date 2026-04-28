import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "admin" | "contrast";
type ButtonSize = "sm" | "md" | "full";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-surface-contrast text-surface hover:bg-surface-contrast-soft active:bg-black shadow-[var(--shadow-soft)]",
  secondary:
    "bg-surface text-foreground ring-1 ring-inset ring-border hover:ring-border-strong hover:bg-surface-soft",
  ghost: "bg-transparent text-muted hover:bg-surface-soft hover:text-foreground",
  admin: "bg-surface text-accent-foreground ring-1 ring-inset ring-accent-soft hover:ring-accent hover:bg-accent-soft/50",
  contrast:
    "bg-foreground text-surface hover:bg-surface-contrast-soft active:bg-black shadow-[var(--shadow-float)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  full: "h-11 w-full px-5 text-sm",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-transparent font-semibold tracking-[-0.01em] transition-colors duration-150 disabled:opacity-60 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({ href, variant, size, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
