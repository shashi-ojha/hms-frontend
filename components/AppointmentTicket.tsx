"use client";

import { Clock, MapPin } from "lucide-react";
import { AppointmentResponse } from "@/lib/types";
import { daysUntil, formatTime, initials } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

const deptColors: Record<string, string> = {
  default: "#0F9488",
};

function deptColor(name: string) {
  // Deterministic color per department name from a small curated palette
  const palette = ["#0F9488", "#F59E0B", "#6366F1", "#FB7185", "#0EA5A0"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function AppointmentTicket({
  appointment,
  onCancel,
}: {
  appointment: AppointmentResponse;
  onCancel?: (id: number) => void;
}) {
  const color = deptColor(appointment.departmentName);
  const [month, day] = new Date(appointment.appointmentDate)
    .toDateString()
    .split(" ")
    .slice(1, 3);

  return (
    <div className="relative flex w-[300px] flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-card transition-transform duration-200 hover:-translate-y-0.5">
      {/* Date block */}
      <div
        className="flex w-24 flex-shrink-0 flex-col items-center justify-center gap-0.5 py-5 text-white"
        style={{ backgroundColor: color }}
      >
        <span className="text-xs font-medium uppercase tracking-wide opacity-90">
          {month}
        </span>
        <span className="font-display text-3xl font-bold leading-none">
          {day}
        </span>
      </div>

      {/* Perforation */}
      <div className="relative w-0 border-l-2 border-dashed border-ink-100">
        <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#F7FAF9]" />
        <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#F7FAF9]" />
      </div>

      {/* Details block */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {appointment.doctorName}
            </p>
            <p className="text-xs text-ink-500">{appointment.departmentName}</p>
          </div>
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {initials(appointment.doctorName)}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(appointment.appointmentTime)}
          <span className="mx-1 text-ink-300">•</span>
          <MapPin className="h-3.5 w-3.5" />
          {appointment.departmentName}
        </div>

        <div className="mt-1 flex items-center justify-between">
          <Badge status={appointment.status}>{appointment.status}</Badge>
          <span className="text-xs font-medium text-brand-700">
            {daysUntil(appointment.appointmentDate)}
          </span>
        </div>

        {onCancel &&
          (appointment.status === "PENDING" ||
            appointment.status === "CONFIRMED") && (
            <button
              onClick={() => onCancel(appointment.id)}
              className="mt-1 text-left text-xs font-medium text-coral-500 hover:text-coral-600"
            >
              Cancel appointment
            </button>
          )}
      </div>
    </div>
  );
}