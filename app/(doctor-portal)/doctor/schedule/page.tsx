"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DoctorAppointmentRow } from "@/components/DoctorAppointmentRow";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  cancelAppointment,
  getDoctorSchedule,
  updateAppointmentStatus,
} from "@/lib/api";
import { AppointmentResponse, AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

// ── Status filter tabs ────────────────────────────────────
const STATUS_TABS: { label: string; value: AppointmentStatus | "ALL" }[] = [
  { label: "All",       value: "ALL"       },
  { label: "Pending",   value: "PENDING"   },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function niceDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function SchedulePage() {
  const { doctor } = useAuth();
  const { showToast } = useToast();
  const [date, setDate] = useState(toISO(new Date()));
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [activeStatus, setActiveStatus] = useState<AppointmentStatus | "ALL">("ALL");

  async function load() {
    if (!doctor) return;
    setLoading(true);
    try {
      const data = await getDoctorSchedule(doctor.id, date);
      setAppointments(data);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor, date]);

  function shiftDay(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(toISO(d));
  }

  // ── Status counts for tab badges ──────────────────────
  function countByStatus(status: AppointmentStatus | "ALL") {
    if (status === "ALL") return appointments.length;
    return appointments.filter((a) => a.status === status).length;
  }

  async function withBusy(id: number, fn: () => Promise<void>) {
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirm(id: number) {
    await withBusy(id, async () => {
      await updateAppointmentStatus(id, "CONFIRMED");
      showToast("Appointment confirmed.", "success");
    });
  }

  async function handleComplete(id: number) {
    await withBusy(id, async () => {
      await updateAppointmentStatus(id, "COMPLETED");
      showToast("Marked complete.", "success");
    });
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    await withBusy(cancelTarget, async () => {
      await cancelAppointment(cancelTarget);
      showToast("Appointment cancelled.", "success");
    });
    setCancelTarget(null);
  }

  return (
    <>
      <Topbar
        title="Schedule"
        subtitle="Your appointments, day by day"
        profileHref="/doctor/profile"
      />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <div className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
          <Button variant="ghost" size="sm" onClick={() => shiftDay(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-100 bg-ink-50 hover:bg-ink-100 focus-visible:ring-brand-500">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center">
            <span className="font-display text-sm font-semibold text-ink-900">
              {niceDate(date)}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 text-xs text-ink-500 bg-transparent focus:outline-none"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => shiftDay(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-100 bg-ink-50 hover:bg-ink-100 focus-visible:ring-brand-500">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Status Filter Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const count = countByStatus(tab.value);
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveStatus(tab.value)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition text-ink-900",
                  isActive
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-ink-100 bg-white text-ink-600 hover:bg-ink-50"
                )}
              >
                {tab.label}
                {/* badge count */}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold text-ink-500",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-ink-100 text-ink-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
           title={
              activeStatus === "ALL"
                ? "No appointments on this day"
                : `No ${activeStatus.toLowerCase()} appointments`
            }
            description={
              activeStatus === "ALL"
                ? "Your schedule is clear — check another date."
                : "Try switching to a different status filter."
            }
          />
        ) : (
          <div className="space-y-3">
            {[...appointments]
              .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
              .map((a) => (
                <DoctorAppointmentRow
                  key={a.id}
                  appointment={a}
                  busy={busyId === a.id}
                  onConfirm={handleConfirm}
                  onComplete={handleComplete}
                  onCancel={(id) => setCancelTarget(id)}
                />
              ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel this appointment?"
        description="The patient will be notified and the slot freed up."
        confirmLabel="Yes, cancel it"
        loading={busyId === cancelTarget}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </>
  );
}