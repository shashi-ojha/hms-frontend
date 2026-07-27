import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type AlertTone = "error" | "success" | "info";

const config: Record<
  AlertTone,
  { icon: typeof Info; classes: string }
> = {
  error: {
    icon: AlertTriangle,
    classes: "bg-coral-50 text-coral-600 border-coral-100",
  },
  success: {
    icon: CheckCircle2,
    classes: "bg-brand-50 text-brand-800 border-brand-100",
  },
  info: {
    icon: Info,
    classes: "bg-ink-100 text-ink-700 border-ink-100",
  },
};

export function Alert({
  tone = "info",
  children,
}: {
  tone?: AlertTone;
  children: React.ReactNode;
}) {
  const { icon: Icon, classes } = config[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm",
        classes
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}