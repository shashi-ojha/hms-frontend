import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-ink-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900",
            "placeholder:text-ink-500/70",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            error && "border-coral-400 focus:ring-coral-400",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-coral-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";