"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Receipt,
  Stethoscope,
  FileText,
  Plus,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppointmentTicket } from "@/components/AppointmentTicket";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  cancelAppointment,
  getPatientAppointments,
  getPatientBills,
} from "@/lib/api";
import { AppointmentResponse, BillResponse } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

export default function DashboardPage() {
  const { user, patient } = useAuth();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [bills, setBills] = useState<BillResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    if (!patient) return;
    setLoading(true);
    const [apptPage, billList] = await Promise.all([
      getPatientAppointments(patient.id),
      getPatientBills(patient.id),
    ]);
    setAppointments(apptPage.content);
    setBills(billList);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  const upcoming = appointments
    .filter((a) => a.status === "PENDING" || a.status === "CONFIRMED")
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime()
    );

  const pendingBills = bills.filter((b) => b.status === "PENDING");
  const pendingTotal = pendingBills.reduce((s, b) => s + b.totalAmount, 0);
  const completedVisits = appointments.filter(
    (a) => a.status === "COMPLETED"
  );
  const lastVisit = completedVisits.sort(
    (a, b) =>
      new Date(b.appointmentDate).getTime() -
      new Date(a.appointmentDate).getTime()
  )[0];

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

  return (
    <>
      <Topbar
        title={`Good to see you, ${user?.name?.split(" ")[0]}`}
        subtitle="Here's what's happening with your care"
      />

      <div className="space-y-8 px-6 pb-10 lg:px-10">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label="Upcoming appointments"
            value={loading ? "—" : String(upcoming.length)}
            tone="teal"
          />
          <StatCard
            icon={Receipt}
            label="Pending bills"
            value={loading ? "—" : formatCurrency(pendingTotal)}
            tone="amber"
          />
          <StatCard
            icon={Stethoscope}
            label="Total visits"
            value={loading ? "—" : String(completedVisits.length)}
            tone="violet"
          />
          <StatCard
            icon={FileText}
            label="Last checkup"
            value={loading ? "—" : lastVisit ? formatDate(lastVisit.appointmentDate) : "—"}
            tone="coral"
          />
        </div>

        {/* Upcoming appointments — signature ticket row */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Upcoming appointments
            </h2>
            <Link href="/doctors">
              <Button size="sm" variant="secondary">
                <Plus className="h-4 w-4" />
                Book new
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              <Skeleton className="h-32 w-[300px]" />
              <Skeleton className="h-32 w-[300px]" />
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming appointments"
              description="Find a doctor and book your next visit — it only takes a minute."
              action={
                <Link href="/doctors">
                  <Button>Find a doctor</Button>
                </Link>
              }
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {upcoming.map((a) => (
                <AppointmentTicket
                  key={a.id}
                  appointment={a}
                  onCancel={() => setCancelTarget(a.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent bills */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Recent bills
            </h2>
            <Link
              href="/bills"
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : bills.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No bills yet"
              description="Bills from your completed visits will show up here."
            />
          ) : (
            <Card className="divide-y divide-ink-100 p-0">
              {bills.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      {b.doctorName}
                      <span className="text-ink-500"> · {b.departmentName}</span>
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatDate(b.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-semibold text-ink-900">
                      {formatCurrency(b.totalAmount)}
                    </span>
                    <Badge status={b.status}>{b.status}</Badge>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
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