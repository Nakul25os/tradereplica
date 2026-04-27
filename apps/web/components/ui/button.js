"use client";

import Link from "next/link";
import clsx from "clsx";

const variants = {
  primary:
    "bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:ring-emerald-300",
  secondary:
    "bg-slate-900/80 text-white hover:bg-slate-800 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-white/10 dark:hover:bg-white/10",
  outline:
    "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-white/10 dark:hover:bg-white/10",
  danger:
    "bg-rose-500 text-white hover:bg-rose-400 focus-visible:ring-rose-200",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  href,
  children,
  ...props
}) {
  const composedClassName = clsx(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={composedClassName} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={composedClassName}
      {...props}
    >
      {children}
    </button>
  );
}
