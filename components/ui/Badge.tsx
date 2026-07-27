import { cn } from "@/lib/cn";

type Tone = "teal" | "amber" | "coral" | "slate" | "violet";

const toneClasses: Record<Tone, string> = {
  teal: "bg-brand-100 text-brand-800",
  amber: "bg-amber-100 text-amber-800",
  coral: "bg-coral-100 text-coral-600",
  slate: "bg-ink-100 text-ink-700",
  violet: "bg-indigo-100 text-indigo-700",
};

const statusTone: Record<string, Tone> = {
  PENDING: "amber",
  CONFIRMED: "teal",
  COMPLETED: "slate",
  CANCELLED: "coral",
  PAID: "teal",
};

export function Badge({
  children,
  tone,
  status,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  status?: string;
  className?: string;
}) {
  const resolvedTone = tone || (status ? statusTone[status] : "slate") || "slate";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[resolvedTone],
        className
      )}
    >
      {children}
    </span>
  );
}