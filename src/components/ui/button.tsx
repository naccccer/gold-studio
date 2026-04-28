import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "admin";
type ButtonSize = "sm" | "md" | "full";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-surface hover:bg-accent-foreground",
  secondary: "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-soft",
  ghost: "bg-surface-soft text-muted hover:bg-surface-muted hover:text-foreground",
  admin: "border border-accent-soft bg-surface text-accent-foreground hover:border-accent hover:bg-accent-soft",
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
    "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition disabled:opacity-60 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
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
