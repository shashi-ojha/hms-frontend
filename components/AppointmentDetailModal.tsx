// components/AppointmentDetailModal.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  FileText,
  IndianRupee,
  Receipt,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import {
  getAppointmentById,
  getBillByAppointmentId,
} from "@/lib/api";
import { AppointmentResponse, BillResponse } from "@/lib/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";

interface Props {
  appointmentId: number | null;
  onClose: () => void;
}

export function AppointmentDetailModal({
  appointmentId,
  onClose,
}: Props) {
  const [appointment, setAppointment] =
    useState<AppointmentResponse | null>(null);
  const [bill, setBill] = useState<BillResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // check for null/undefined explicitly so numeric 0 is allowed
    if (appointmentId == null) {
      setAppointment(null);
      setBill(null);
      setError("");
      return;
    }

    async function load() {
      setLoading(true);
      setError("");
      try {
        const appt = await getAppointmentById(appointmentId!);
        setAppointment(appt);

        if (
          appt.status === "COMPLETED" ||
          appt.status === "CONFIRMED"
        ) {
          setBillLoading(true);
          try {
            const b = await getBillByAppointmentId(appointmentId!);
            setBill(b);
          } catch {
            setBill(null); // No bill yet — that's fine
          } finally {
            setBillLoading(false);
          }
        }
      } catch {
        setError("Couldn't load appointment details.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [appointmentId]);

  return (
    <Modal
      open={appointmentId !== null}
      onClose={onClose}
      title="Appointment Details"
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : appointment ? (
        <div className="space-y-5">

          {/* ── Appointment info ──────────────────────────── */}
          <div className="rounded-xl bg-ink-50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase
                          tracking-wide text-ink-500">
              Appointment Info
            </p>

            {[
              {
                icon: User,
                label: "Patient",
                value: appointment.patientName,
              },
              {
                icon: Stethoscope,
                label: "Doctor",
                value: `Dr. ${appointment.doctorName}`,
              },
              {
                icon: Building2,
                label: "Department",
                value: appointment.departmentName,
              },
              {
                icon: Calendar,
                label: "Date",
                value: formatDate(appointment.appointmentDate),
              },
              {
                icon: Clock,
                label: "Time",
                value: formatTime(appointment.appointmentTime),
              },
              {
                icon: FileText,
                label: "Reason",
                value: appointment.reason || "—",
              },
              {
                icon: FileText,
                label: "Notes",
                value: appointment.notes || "—",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3"
              >
                <Icon className="h-4 w-4 text-ink-400
                                 shrink-0" />
                <span className="text-xs text-ink-500 w-20
                                 shrink-0">
                  {label}
                </span>
                <span className="text-sm font-medium
                                 text-ink-900 flex-1">
                  {value}
                </span>
              </div>
            ))}

            {/* Status */}
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 shrink-0" />
              <span className="text-xs text-ink-500 w-20
                               shrink-0">
                Status
              </span>
              <Badge status={appointment.status}>
                {appointment.status}
              </Badge>
            </div>
          </div>

          {/* ✅ Bill section ─────────────────────────────── */}
          {(appointment.status === "COMPLETED" ||
            appointment.status === "CONFIRMED") && (
            <div className="rounded-xl border border-ink-100
                            p-4 space-y-3">
              <p className="text-xs font-semibold uppercase
                            tracking-wide text-ink-500
                            flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                Bill
              </p>

              {billLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : bill ? (
                <div className="space-y-2">
                  <div className="flex justify-between
                                  text-sm">
                    <span className="text-ink-500">
                      Consultation fee
                    </span>
                    <span className="text-ink-900">
                      {formatCurrency(bill.consultationFee)}
                    </span>
                  </div>
                  {bill.additionalCharges > 0 && (
                    <div className="flex justify-between
                                    text-sm">
                      <span className="text-ink-500">
                        Additional charges
                      </span>
                      <span className="text-ink-900">
                        {formatCurrency(
                          bill.additionalCharges
                        )}
                      </span>
                    </div>
                  )}
                  <hr className="border-ink-100" />
                  <div className="flex justify-between
                                  text-sm font-semibold">
                    <span className="text-ink-900">
                      Total
                    </span>
                    <span className="text-ink-900">
                      {formatCurrency(bill.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center
                                  justify-between pt-1">
                    <Badge status={bill.status}>
                      {bill.status}
                    </Badge>
                    {bill.paymentMethod && (
                      <span className="text-xs text-ink-500">
                        via {bill.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-400 italic">
                  No bill generated yet for this appointment.
                </p>
              )}
            </div>
          )}

          {/* Consultation amount */}
          {appointment.amount > 0 && !bill && (
            <div className="flex items-center justify-between
                            rounded-xl bg-brand-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4
                                       text-brand-700" />
                <span className="text-sm text-ink-700">
                  Consultation fee
                </span>
              </div>
              <span className="font-display font-semibold
                               text-ink-900">
                {formatCurrency(appointment.amount)}
              </span>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
