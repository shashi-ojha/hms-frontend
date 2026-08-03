"use client";

import { useEffect, useState } from "react";
import {
  Search,
  User,
  Stethoscope,
  CalendarPlus,
  X,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SlotPicker } from "@/components/SlotPicker";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  searchPatients,
  searchDoctors,
  getDoctorsByDepartment,
  getAvailableDoctors,
  getDepartments,
  bookAppointment,
  apiErrorMessage,
} from "@/lib/api";
import { PatientResponse, DoctorResponse } from "@/lib/types";
import { formatCurrency, initials } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────
interface Department {
  id: number;
  name: string;
}

// ─── Doctor search mode ───────────────────────────────────
type DoctorSearchMode = "department" | "name";

export default function BookAppointmentPage() {
  // ── Patient ─────────────────────────────────────────────
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<PatientResponse | null>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  // ── Doctor ──────────────────────────────────────────────
  const [doctorSearchMode, setDoctorSearchMode] =
    useState<DoctorSearchMode>("department");
  const [doctorQuery, setDoctorQuery] = useState("");
  const [doctorResults, setDoctorResults] = useState<DoctorResponse[]>([]);
  const [selectedDoctor, setSelectedDoctor] =
    useState<DoctorResponse | null>(null);
  const [searchingDoctors, setSearchingDoctors] = useState(false);

  // ── Department filter ───────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);

  // ── Booking ─────────────────────────────────────────────
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // ── Load departments on mount ────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingDepts(true);
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch {
        setDepartments([]);
      } finally {
        setLoadingDepts(false);
      }
    }
    load();
  }, []);

useEffect(() => {
  if (doctorSearchMode !== "department") return;
  if (!selectedDeptId) {
    setDoctorResults([]);
    return;
  }

  async function loadDoctors() {
    setSearchingDoctors(true);
    try {
      // ✅ Pass available flag directly to backend
      const data: DoctorResponse[] =
        await getDoctorsByDepartment(
          Number(selectedDeptId),
          showAvailableOnly ? true : undefined  // ✅ undefined = all doctors
        );
      setDoctorResults(data);
    } catch {
      setDoctorResults([]);
    } finally {
      setSearchingDoctors(false);
    }
  }

  loadDoctors();
}, [selectedDeptId, showAvailableOnly, doctorSearchMode]);


  // ── Patient search ───────────────────────────────────────
  async function handlePatientSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!patientQuery.trim()) return;
    setSearchingPatients(true);
    try {
      const data = await searchPatients({
        name: patientQuery,
        size: 10,
      });
      setPatientResults(data.content);
    } finally {
      setSearchingPatients(false);
    }
  }

  // ── Doctor name search ───────────────────────────────────
  async function handleDoctorSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!doctorQuery.trim()) return;
    setSearchingDoctors(true);
    try {
      const data = await searchDoctors({
        name: doctorQuery,
        available: showAvailableOnly,
        size: 10,
      });
      setDoctorResults(data.content);
    } finally {
      setSearchingDoctors(false);
    }
  }

  // ── Book appointment ─────────────────────────────────────
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
      setSelectedDeptId("");
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Couldn't book this slot. It may already be taken."
        )
      );
    } finally {
      setBooking(false);
    }
  }

  // ──────────────────────────────────────────────────────────
  return (
    <>
      <Topbar
        title="Book Appointment"
        subtitle="Find a patient and doctor to schedule a visit"
        profileHref="/reception/dashboard"
      />

      <div className="space-y-6 px-6 pb-10 lg:px-10">

        {success && (
          <Alert tone="success">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Appointment booked successfully.
            </span>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ── Patient picker ────────────────────────────── */}
          <Card>
            <h3 className="mb-3 flex items-center gap-2
                           font-display text-sm font-semibold
                           text-ink-900">
              <User className="h-4 w-4 text-brand-700" />
              1. Select patient
            </h3>

            {selectedPatient ? (
              <div className="flex items-center gap-3
                              rounded-xl bg-brand-50 p-3">
                <div className="flex h-10 w-10 items-center
                                justify-center rounded-full
                                bg-brand-700 text-xs font-semibold
                                text-white">
                  {initials(selectedPatient.patientName)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    {selectedPatient.patientName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {selectedPatient.phone}
                  </p>
                </div>
                <button onClick={() => setSelectedPatient(null)}>
                  <X className="h-4 w-4 text-ink-500" />
                </button>
              </div>
            ) : (
              <>
                <form
                  onSubmit={handlePatientSearch}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Search patient name"
                    value={patientQuery}
                    onChange={(e) =>
                      setPatientQuery(e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    loading={searchingPatients}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <div className="mt-3 space-y-2">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className="flex w-full items-center gap-3
                                 rounded-xl border border-ink-100
                                 p-2.5 text-left
                                 hover:border-brand-300
                                 hover:bg-brand-50"
                    >
                      <div className="flex h-9 w-9 items-center
                                      justify-center rounded-full
                                      bg-brand-700 text-xs
                                      font-semibold text-white">
                        {initials(p.patientName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium
                                      text-ink-900">
                          {p.patientName}
                        </p>
                        <p className="text-xs text-ink-500">
                          {p.phone}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* ── Doctor picker ─────────────────────────────── */}
          <Card>
            <h3 className="mb-3 flex items-center gap-2
                           font-display text-sm font-semibold
                           text-ink-900">
              <Stethoscope className="h-4 w-4 text-brand-700" />
              2. Select doctor
            </h3>

            {selectedDoctor ? (
              <div className="flex items-center gap-3
                              rounded-xl bg-brand-50 p-3">
                <div className="flex h-10 w-10 items-center
                                justify-center rounded-full
                                bg-brand-700 text-xs font-semibold
                                text-white">
                  {initials(selectedDoctor.doctorName)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    {selectedDoctor.doctorName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {selectedDoctor.specialization} ·{" "}
                    {formatCurrency(selectedDoctor.consultationFee)}
                  </p>
                </div>
                <button onClick={() => setSelectedDoctor(null)}>
                  <X className="h-4 w-4 text-ink-500" />
                </button>
              </div>
            ) : (
              <>
                {/* ── Search mode toggle ─────────────────── */}
                <div className="mb-3 flex rounded-xl border
                                border-ink-100 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDoctorSearchMode("department");
                      setDoctorResults([]);
                      setDoctorQuery("");
                    }}
                    className={`flex-1 flex items-center
                               justify-center gap-1.5 rounded-lg
                               px-3 py-1.5 text-xs font-medium
                               transition-colors ${
                      doctorSearchMode === "department"
                        ? "bg-brand-700 text-white"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    By Department
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDoctorSearchMode("name");
                      setDoctorResults([]);
                      setSelectedDeptId("");
                    }}
                    className={`flex-1 flex items-center
                               justify-center gap-1.5 rounded-lg
                               px-3 py-1.5 text-xs font-medium
                               transition-colors ${
                      doctorSearchMode === "name"
                        ? "bg-brand-700 text-white"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    <Search className="h-3.5 w-3.5" />
                    By Name
                  </button>
                </div>

                {/* ── Available only toggle ──────────────── */}
                <label className="mb-3 flex items-center
                                  gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={(e) =>
                      setShowAvailableOnly(e.target.checked)
                    }
                    className="rounded"
                  />
                  <span className="text-xs font-medium
                                   text-ink-600">
                    Show available doctors only
                  </span>
                </label>

                {/* ── Department mode ────────────────────── */}
                {doctorSearchMode === "department" && (
                  <>
                    {loadingDepts ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        label="Select department"
                        value={selectedDeptId}
                        onChange={(e) => {
                          setSelectedDeptId(e.target.value);
                          setSelectedDoctor(null);
                        }}
                      >
                        <option value="">
                          Choose a department
                        </option>
                        {departments.map((d) => (
                          <option
                            key={d.id}
                            value={String(d.id)}
                          >
                            {d.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  </>
                )}

                {/* ── Name search mode ───────────────────── */}
                {doctorSearchMode === "name" && (
                  <form
                    onSubmit={handleDoctorSearch}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Search doctor name"
                      value={doctorQuery}
                      onChange={(e) =>
                        setDoctorQuery(e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      loading={searchingDoctors}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                )}

                {/* ── Doctor results ─────────────────────── */}
                <div className="mt-3 space-y-2">
                  {searchingDoctors && (
                    <Skeleton className="h-16 w-full" />
                  )}

                  {!searchingDoctors &&
                    selectedDeptId &&
                    doctorResults.length === 0 &&
                    doctorSearchMode === "department" && (
                      <p className="text-xs text-ink-500
                                    text-center py-4">
                       {showAvailableOnly
                        ? "No available doctors in this department right now. Uncheck to see all doctors."
                        : "No doctors found in this department."}
                      </p>
                    )}

                  {doctorResults.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDoctor(d)}
                      disabled={!d.available}
                      className={`flex w-full items-center gap-3
                                rounded-xl border p-2.5 text-left
                                transition-colors
                                ${d.available
                                  ? "border-ink-100 hover:border-brand-300 hover:bg-brand-50"
                                  : "border-ink-100 bg-ink-50 opacity-60 cursor-not-allowed"
                                }`}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center
                    rounded-full text-xs font-semibold text-white
                    ${d.available ? "bg-brand-700" : "bg-ink-400"}`}>
                        {initials(d.doctorName)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-900">
                          {d.doctorName}
                        </p>
                        <p className="text-xs text-ink-500">
                          {d.specialization} · {formatCurrency(d.consultationFee)}
                        </p>
                      </div>
                      {/* Available badge */}
                     {d.available ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5
                                        text-xs font-medium text-green-700">
                          Available
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5
                                        text-xs font-medium text-red-600">
                          Unavailable
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── Step 3 — Date & Time ────────────────────────── */}
        {selectedPatient && selectedDoctor ? (
          <Card>
            <h3 className="mb-3 flex items-center gap-2
                           font-display text-sm font-semibold
                           text-ink-900">
              <CalendarPlus className="h-4 w-4 text-brand-700" />
              3. Pick date &amp; time
            </h3>
            <form onSubmit={handleBook} className="space-y-4">
              <Input
                type="date"
                label="Date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium
                                  text-ink-700">
                  Available times
                </label>
                <SlotPicker
                  doctorId={selectedDoctor.id}
                  date={date}
                  value={time}
                  onChange={setTime}
                />
              </div>
              <Input
                label="Reason for visit"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              {error && <Alert tone="error">{error}</Alert>}
              <Button
                type="submit"
                loading={booking}
                disabled={!time}
              >
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
