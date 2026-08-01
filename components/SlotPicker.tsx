"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getAvailableSlots } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/Skeleton";

export function SlotPicker({
  doctorId,
  date,
  value,
  onChange,
}: {
  doctorId: number;
  date: string;
  value: string;
  onChange: (time: string) => void;
}) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    setLoading(true);
    setError(false);
    onChange("");
    getAvailableSlots(doctorId, date)
      .then(setSlots)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date]);

  if (!date) {
    return (
      <p className="text-xs text-ink-500">Pick a date to see available times.</p>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-coral-500">
        Couldn't load available times. Try a different date.
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-ink-500">
        <Clock className="h-3.5 w-3.5" />
        No open slots on this date — try another day.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className={cn(
            "rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors",
            value === slot
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-ink-100 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50"
          )}
        >
          {formatTime(slot)}
        </button>
      ))}
    </div>
  );
}