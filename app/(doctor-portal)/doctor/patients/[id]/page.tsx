"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  Droplet,
  FileText,
  MapPin,
  Phone,
  Pill,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AddPrescriptionModal } from "@/components/AddPrescriptionModal";
import { PatientFilesSection } from "@/components/PatientFilesSection";
import { useToast } from "@/lib/toast-context";
import {
  createMedicalRecord,
  getPatientById,
  getPatientHistory,
  apiErrorMessage,
} from "@/lib/api";
import { MedicalRecordResponse, PatientResponse } from "@/lib/types";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function DoctorPatientDetailPageWrapper() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-ink-500">Loading...</div>}>
      <DoctorPatientDetailPage />
    </Suspense>
  );
}

function DoctorPatientDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const patientId = Number(params.id);
  const appointmentId = searchParams.get("appointment");

  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [records, setRecords] = useState<MedicalRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [prescriptionTarget, setPrescriptionTarget] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [p, history] = await Promise.all([
        getPatientById(patientId),
        getPatientHistory(patientId),
      ]);
      setPatient(p);
      setRecords(
        [...history].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch {
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (patientId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <>
      <Topbar title="Patient" subtitle="History, diagnoses and prescriptions" profileHref="/doctor/profile" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : !patient ? (
          <EmptyState
            icon={FileText}
            title="Patient not found"
            description="This patient record couldn't be loaded."
          />
        ) : (
          <>
            <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-lg font-semibold text-white">
                  {initials(patient.patientName)}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-900">
                    {patient.patientName}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <Droplet className="h-3.5 w-3.5" />
                      {patient.bloodGroup?.replace("_", " ") || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {patient.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {patient.address}
                    </span>
                  </div>
                </div>
              </div>
              {patient.emergencyContactName && (
                <div className="flex items-center gap-2 rounded-xl bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
                  <ShieldAlert className="h-4 w-4" />
                  {patient.emergencyContactName} · {patient.emergencyContact}
                </div>
              )}
            </Card>

            {patient.medicalHistory && (
              <Card>
                <h3 className="mb-2 font-display text-sm font-semibold text-ink-900">
                  Medical history
                </h3>
                <p className="text-sm text-ink-700">{patient.medicalHistory}</p>
              </Card>
            )}

            <PatientFilesSection patientId={patientId} canUpload canDelete={false} />

            {appointmentId && (
              <AddRecordCard
                appointmentId={Number(appointmentId)}
                onCreated={() => {
                  showToast("Medical record added.", "success");
                  router.replace(`/doctor/patients/${patientId}`);
                  load();
                }}
              />
            )}

            <div>
              <h3 className="mb-3 font-display text-base font-semibold text-ink-900">
                Visit history
              </h3>

              {records.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No records yet"
                  description="Once you complete a visit, add a diagnosis here."
                />
              ) : (
                <div className="relative space-y-4 border-l-2 border-dashed border-ink-100 pl-6">
                  {records.map((r) => {
                    const open = openId === r.id;
                    return (
                      <div key={r.id} className="relative">
                        <span className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-white bg-brand-600" />
                        <Card className="overflow-hidden p-0">
                          <button
                            onClick={() => setOpenId(open ? null : r.id)}
                            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                          >
                            <div>
                              <p className="text-sm font-semibold text-ink-900">
                                {r.diagnosis}
                              </p>
                              <p className="mt-0.5 text-xs text-ink-500">
                                {formatDate(r.createdAt)}
                              </p>
                            </div>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 flex-shrink-0 text-ink-500 transition-transform",
                                open && "rotate-180"
                              )}
                            />
                          </button>

                          {open && (
                            <div className="space-y-4 border-t border-ink-100 px-5 py-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                                  Treatment
                                </p>
                                <p className="mt-1 text-sm text-ink-700">{r.treatment}</p>
                              </div>
                              {r.notes && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                                    Notes
                                  </p>
                                  <p className="mt-1 text-sm text-ink-700">{r.notes}</p>
                                </div>
                              )}

                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                    <Pill className="h-3.5 w-3.5" />
                                    Prescriptions
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPrescriptionTarget(r.id)}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add
                                  </Button>
                                </div>
                                {r.prescriptions.length === 0 ? (
                                  <p className="text-xs text-ink-500">
                                    No prescriptions added yet.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {r.prescriptions.map((p) => (
                                      <div
                                        key={p.id}
                                        className="rounded-xl bg-brand-50 px-3.5 py-2.5"
                                      >
                                        <div className="flex items-center justify-between">
                                          <p className="text-sm font-medium text-ink-900">
                                            {p.medicineName}
                                          </p>
                                          <span className="text-xs font-medium text-brand-700">
                                            {p.dosage}
                                          </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-ink-500">
                                          {p.duration}
                                          {p.instructions && ` · ${p.instructions}`}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AddPrescriptionModal
        recordId={prescriptionTarget}
        onClose={() => setPrescriptionTarget(null)}
        onAdded={() => {
          showToast("Prescription added.", "success");
          setPrescriptionTarget(null);
          load();
        }}
      />
    </>
  );
}

function AddRecordCard({
  appointmentId,
  onCreated,
}: {
  appointmentId: number;
  onCreated: () => void;
}) {
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createMedicalRecord({ appointmentId, diagnosis, treatment, notes });
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the record. Try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-brand-200 bg-brand-50/40">
      <h3 className="mb-3 font-display text-sm font-semibold text-ink-900">
        Add medical record for this visit
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-700">Diagnosis</label>
          <input
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            required
            placeholder="e.g. Acute bronchitis"
            className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-700">Treatment</label>
          <textarea
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            required
            rows={2}
            placeholder="Describe the treatment plan"
            className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-700">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" loading={loading}>
          Save record
        </Button>
      </form>
    </Card>
  );
}