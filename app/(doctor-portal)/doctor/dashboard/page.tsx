"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Users, CheckCircle2, Power } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DoctorAppointmentRow } from "@/components/DoctorAppointmentRow";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  cancelAppointment,
  getDoctorAppointments,
  getDoctorSchedule,
  toggleDoctorAvailability,
  updateAppointmentStatus,
} from "@/lib/api";
import { AppointmentResponse } from "@/lib/types";
import { cn } from "@/lib/cn";

export default function DoctorDashboardPage() {
  const { user, doctor, refreshDoctor } = useAuth();
  const { showToast } = useToast();
  const [today, setToday] = useState<AppointmentResponse[]>([]);
  const [allAppointments, setAllAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const todayISO = new Date().toISOString().split("T")[0];

  console.log("DoctorDashboardPage render", { doctor, today, allAppointments });
  async function load() {
    if (!doctor) return;
    setLoading(true);
    const [scheduleData, allData] = await Promise.all([
      getDoctorSchedule(doctor.id, todayISO),
      getDoctorAppointments(doctor.id, 0, 200),
    ]);
    setToday(scheduleData);
    setAllAppointments(allData.content);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor]);

  const completedToday = today.filter((a) => a.status === "COMPLETED").length;
  const uniquePatients = new Set(allAppointments.map((a) => a.patientId)).size;

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
      showToast("Marked complete. Add a medical record when ready.", "success");
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

  async function handleAvailabilityToggle() {
    if (!doctor) return;
    setTogglingAvailability(true);
    try {
      await toggleDoctorAvailability(doctor.id, !doctor.available);
      await refreshDoctor();
      showToast(
        `You're now marked as ${!doctor.available ? "available" : "unavailable"}.`,
        "success"
      );
    } catch {
      showToast("Couldn't update availability.", "error");
    } finally {
      setTogglingAvailability(false);
    }
  }

  return (
    <>
      <Topbar
        title={`Good to see you, Dr. ${user?.name?.split(" ").slice(-1)[0] || ""}`}
        subtitle={doctor ? `${doctor.specialization} · ${doctor.departmentName}` : undefined}
        profileHref="/doctor/profile"
      />

      <div className="space-y-8 px-6 pb-10 lg:px-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={CalendarClock}
            label="Today's appointments"
            value={loading ? "—" : String(today.length)}
            tone="teal"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed today"
            value={loading ? "—" : String(completedToday)}
            tone="violet"
          />
          <StatCard
            icon={Users}
            label="Total patients seen"
            value={loading ? "—" : String(uniquePatients)}
            tone="coral"
          />
          <button
            onClick={handleAvailabilityToggle}
            disabled={togglingAvailability}
            className={cn(
              "flex flex-col items-start justify-center rounded-2xl border p-4 text-left shadow-card transition-colors disabled:opacity-60",
              doctor?.available
                ? "border-brand-200 bg-brand-50"
                : "border-ink-100 bg-white"
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                doctor?.available ? "bg-brand-700 text-white" : "bg-ink-100 text-ink-500"
              )}
            >
              <Power className="h-4.5 w-4.5" />
            </div>
            <p className="mt-3 font-display text-sm font-semibold text-ink-900">
              {doctor?.available ? "Available" : "Unavailable"}
            </p>
            <p className="text-xs text-ink-500">Tap to toggle</p>
          </button>
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
            Today's schedule
          </h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : today.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No appointments today"
              description="Enjoy the quiet — your schedule will show up here as patients book."
            />
          ) : (
            <div className="space-y-3">
              {today
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