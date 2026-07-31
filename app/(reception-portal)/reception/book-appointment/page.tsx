"use client";

import { useState } from "react";
import { Search, User, Stethoscope, CalendarPlus, X } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { searchPatients, searchDoctors, bookAppointment, apiErrorMessage } from "@/lib/api";
import { PatientResponse, DoctorResponse } from "@/lib/types";
import { formatCurrency, initials } from "@/lib/format";

export default function BookAppointmentPage() {
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  const [doctorQuery, setDoctorQuery] = useState("");
  const [doctorResults, setDoctorResults] = useState<DoctorResponse[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResponse | null>(null);
  const [searchingDoctors, setSearchingDoctors] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handlePatientSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!patientQuery.trim()) return;
    setSearchingPatients(true);
    try {
      const data = await searchPatients({ name: patientQuery, size: 10 });
      setPatientResults(data.content);
    } finally {
      setSearchingPatients(false);
    }
  }

  async function handleDoctorSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!doctorQuery.trim()) return;
    setSearchingDoctors(true);
    try {
      const data = await searchDoctors({ name: doctorQuery, available: true, size: 10 });
      setDoctorResults(data.content);
    } finally {
      setSearchingDoctors(false);
    }
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctor) return;
    setError("");
    setBooking(true);
    try {
      await bookAppointment({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.id,
        appointmentDate: date,
        appointmentTime: time,
        reason,
      });
      setSuccess(true);
      setSelectedPatient(null);
      setSelectedDoctor(null);
      setDate("");
      setTime("");
      setReason("");
      setPatientResults([]);
      setDoctorResults([]);
      setPatientQuery("");
      setDoctorQuery("");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't book this slot. It may already be taken."));
    } finally {
      setBooking(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <Topbar title="Book Appointment" subtitle="Find a patient and doctor to schedule a visit" profileHref="/reception/dashboard" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        {success && (
          <Alert tone="success">Appointment booked successfully.</Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Patient picker */}
          <Card>
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-900">
              <User className="h-4 w-4 text-brand-700" />
              1. Select patient
            </h3>
            {selectedPatient ? (
              <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                  {initials(selectedPatient.patientName)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    {selectedPatient.patientName}
                  </p>
                  <p className="text-xs text-ink-500">{selectedPatient.phone}</p>
                </div>
                <button onClick={() => setSelectedPatient(null)}>
                  <X className="h-4 w-4 text-ink-500" />
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handlePatientSearch} className="flex gap-2">
                  <Input
                    placeholder="Search patient name"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" loading={searchingPatients}>
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <div className="mt-3 space-y-2">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className="flex w-full items-center gap-3 rounded-xl border border-ink-100 p-2.5 text-left hover:border-brand-300 hover:bg-brand-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                        {initials(p.patientName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900">{p.patientName}</p>
                        <p className="text-xs text-ink-500">{p.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Doctor picker */}
          <Card>
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-900">
              <Stethoscope className="h-4 w-4 text-brand-700" />
              2. Select doctor
            </h3>
            {selectedDoctor ? (
              <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                  {initials(selectedDoctor.doctorName)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    {selectedDoctor.doctorName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {selectedDoctor.specialization} · {formatCurrency(selectedDoctor.consultationFee)}
                  </p>
                </div>
                <button onClick={() => setSelectedDoctor(null)}>
                  <X className="h-4 w-4 text-ink-500" />
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleDoctorSearch} className="flex gap-2">
                  <Input
                    placeholder="Search doctor name"
                    value={doctorQuery}
                    onChange={(e) => setDoctorQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" loading={searchingDoctors}>
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <div className="mt-3 space-y-2">
                  {doctorResults.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDoctor(d)}
                      className="flex w-full items-center gap-3 rounded-xl border border-ink-100 p-2.5 text-left hover:border-brand-300 hover:bg-brand-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                        {initials(d.doctorName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900">{d.doctorName}</p>
                        <p className="text-xs text-ink-500">{d.specialization}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {selectedPatient && selectedDoctor ? (
          <Card>
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-900">
              <CalendarPlus className="h-4 w-4 text-brand-700" />
              3. Pick date &amp; time
            </h3>
            <form onSubmit={handleBook} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  type="date"
                  label="Date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <Input
                  type="time"
                  label="Time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <Input
                label="Reason for visit"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              {error && <Alert tone="error">{error}</Alert>}
              <Button type="submit" loading={booking}>
                Confirm booking
              </Button>
            </form>
          </Card>
        ) : (
          <EmptyState
            icon={CalendarPlus}
            title="Select a patient and doctor to continue"
            description="Once both are chosen, you'll be able to pick a date and time."
          />
        )}
      </div>
    </>
  );
}