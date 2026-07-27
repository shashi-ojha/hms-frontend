import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-ink-100/80 shadow-card p-5 transition-shadow duration-200",
        className
      )}
      {...props}
    />
  );
}