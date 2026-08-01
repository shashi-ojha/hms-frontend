"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SlotPicker } from "@/components/SlotPicker";
import { DoctorResponse } from "@/lib/types";
import { formatCurrency, initials } from "@/lib/format";
import { bookAppointment, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function BookAppointmentModal({
  doctor,
  onClose,
  onBooked,
}: {
  doctor: DoctorResponse | null;
  onClose: () => void;
  onBooked: () => void;
}) {
  const { patient } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doctor || !patient || !time) return;
    setError("");
    setLoading(true);
    try {
      await bookAppointment({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: date,
        appointmentTime: time,
        reason,
      });
      onBooked();
      setDate("");
      setTime("");
      setReason("");
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Couldn't book this slot. It may already be taken — try another time."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!doctor} onClose={onClose} title="Book an appointment">
      {doctor && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
              {initials(doctor.doctorName)}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {doctor.doctorName}
              </p>
              <p className="text-xs text-ink-500">
                {doctor.specialization} · {doctor.departmentName}
              </p>
            </div>
            <span className="ml-auto font-display text-sm font-semibold text-brand-700">
              {formatCurrency(doctor.consultationFee)}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="date"
              label="Date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-700">
                Available times
              </label>
              <SlotPicker
                doctorId={doctor.id}
                date={date}
                value={time}
                onChange={setTime}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-700">
                Reason for visit
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Briefly describe your symptoms or reason for the visit"
                className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && <Alert tone="error">{error}</Alert>}

            <Button type="submit" className="w-full" loading={loading} disabled={!time}>
              <CalendarPlus className="h-4 w-4" />
              Confirm booking
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
}