"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AppointmentTicket } from "@/components/AppointmentTicket";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { cancelAppointment, getPatientAppointments } from "@/lib/api";
import { AppointmentResponse } from "@/lib/types";
import Link from "next/link";

type Tab = "upcoming" | "past" | "cancelled";

export default function AppointmentsPage() {
  const { patient } = useAuth();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    if (!patient) return;
    setLoading(true);
    const data = await getPatientAppointments(patient.id, 0, 100);
    setAppointments(data.content);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelAppointment(cancelTarget);
      showToast("Appointment cancelled.", "success");
      await load();
    } catch {
      showToast("Couldn't cancel this appointment. Try again.", "error");
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  const filtered = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime()
    );
    if (tab === "upcoming")
      return sorted.filter(
        (a) => a.status === "PENDING" || a.status === "CONFIRMED"
      );
    if (tab === "past")
      return sorted.filter((a) => a.status === "COMPLETED");
    return sorted.filter((a) => a.status === "CANCELLED");
  }, [appointments, tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past visits" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <>
      <Topbar title="Appointments" subtitle="All your visits, in one place" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <div className="flex gap-1 rounded-2xl border border-ink-100 bg-white p-1.5 w-fit shadow-card">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-brand-700 text-white"
                  : "text-ink-500 hover:bg-ink-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={`No ${tab} appointments`}
            description={
              tab === "upcoming"
                ? "You don't have anything scheduled. Book a visit whenever you're ready."
                : `Your ${tab} appointments will appear here.`
            }
            action={
              tab === "upcoming" ? (
                <Link href="/doctors">
                  <Button>Find a doctor</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <AppointmentTicket
                key={a.id}
                appointment={a}
                onCancel={tab === "upcoming" ? () => setCancelTarget(a.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel appointment?"
        description="This will free up the slot and notify your doctor. You can always book a new one."
        confirmLabel="Yes, cancel it"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </>
  );
}