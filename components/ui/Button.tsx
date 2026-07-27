"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants: Record<string, string> = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 shadow-soft focus-visible:ring-brand-500",
  secondary:
    "bg-white text-ink-900 border border-ink-100 hover:border-brand-300 hover:text-brand-700 focus-visible:ring-brand-500",
  ghost:
    "bg-transparent text-ink-700 hover:bg-ink-100 focus-visible:ring-ink-300",
  danger:
    "bg-coral-500 text-white hover:bg-coral-600 shadow-soft focus-visible:ring-coral-400",
};

const sizes: Record<string, string> = {
  sm: "text-sm px-3 py-1.5 rounded-xl",
  md: "text-sm px-4 py-2.5 rounded-xl",
  lg: "text-base px-5 py-3 rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";