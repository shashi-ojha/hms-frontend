"use client";

import Link from "next/link";
import { Clock, FileText, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppointmentResponse } from "@/lib/types";
import { formatTime, initials } from "@/lib/format";

export function DoctorAppointmentRow({
  appointment,
  onConfirm,
  onComplete,
  onCancel,
  busy,
}: {
  appointment: AppointmentResponse;
  onConfirm?: (id: number) => void;
  onComplete?: (id: number) => void;
  onCancel?: (id: number) => void;
  busy?: boolean;
}) {
  const a = appointment;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink-100/80 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
          {initials(a.patientName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">
            {a.patientName}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-ink-500">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(a.appointmentTime)}
            {a.reason && <span className="truncate">· {a.reason}</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge status={a.status}>{a.status}</Badge>

        {a.status === "PENDING" && onConfirm && (
          <Button size="sm" variant="secondary" onClick={() => onConfirm(a.id)} loading={busy}>
            Confirm
          </Button>
        )}
        {a.status === "CONFIRMED" && onComplete && (
          <Button size="sm" onClick={() => onComplete(a.id)} loading={busy}>
            Mark complete
          </Button>
        )}
        {(a.status === "PENDING" || a.status === "CONFIRMED") && onCancel && (
          <Button size="sm" variant="ghost" onClick={() => onCancel(a.id)} loading={busy}>
            Cancel
          </Button>
        )}
        {a.status === "COMPLETED" && (
          <Link href={`/doctor/patients/${a.patientId}?appointment=${a.id}`}>
            <Button size="sm" variant="secondary">
              <FileText className="h-3.5 w-3.5" />
              Record
            </Button>
          </Link>
        )}
        <Link href={`/doctor/patients/${a.patientId}`}>
          <Button size="sm" variant="ghost">
            <User className="h-3.5 w-3.5" />
            Patient
          </Button>
        </Link>
      </div>
    </div>
  );
}