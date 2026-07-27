import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "teal",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "teal" | "amber" | "coral" | "violet";
}) {
  const toneClasses = {
    teal: "bg-brand-100 text-brand-700",
    amber: "bg-amber-100 text-amber-700",
    coral: "bg-coral-100 text-coral-600",
    violet: "bg-indigo-100 text-indigo-700",
  }[tone];

  return (
    <div className="rounded-2xl border border-ink-100/80 bg-white p-4 shadow-card">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", toneClasses)}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink-900">
        {value}
      </p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
