"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pill,
  Save,
  X,
  AlertTriangle,
  FileText,
  Download,
  Image,
  File,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import {
  getAppointmentsByDoctor,
  getRecordByAppointment,
  updateMedicalRecord,
  getPrescriptionsByRecord,
  addPrescription,
  deletePrescription,
  apiErrorMessage,
  getPatientFiles 
} from "@/lib/api";
import { AppointmentResponse } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { downloadFileWithAuth } from "@/lib/download";

// ─── Types ────────────────────────────────────────────────
interface MedicalRecord {
  id: number;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  createdAt: string;
}

interface Prescription {
  id: number;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
}

interface PatientFile {
  id: number;
  originalFileName: string;
  fileType: string;
  contentType: string;
  fileSize: number;
  description: string;
  downloadUrl: string;
  createdAt: string;
  fileName: string;
}

export default function DoctorRecordsPage() {
    const { user, doctor } = useAuth();
    const { showToast } = useToast();

  const [appointments, setAppointments] = useState<
    AppointmentResponse[]
  >([]);
  const [loading, setLoading] = useState(true);

  // ── Expanded record ──────────────────────────────────────
  const [expandedId, setExpandedId] = useState<number | null>(
    null
  );
  const [records, setRecords] = useState<
    Record<number, MedicalRecord>
  >({});
  const [prescriptions, setPrescriptions] = useState<
    Record<number, Prescription[]>
  >({});
  const [loadingRecord, setLoadingRecord] = useState<
    number | null
  >(null);

    const [files, setFiles] = useState<Record<number, PatientFile[]>>({});
    const [loadingFiles, setLoadingFiles] = useState<number | null>(null);
    const [downloading, setDownloading] = useState<number | null>(null);
  // ── Edit record modal ────────────────────────────────────
  const [editRecord, setEditRecord] =
    useState<MedicalRecord | null>(null);
  const [editForm, setEditForm] = useState({
    diagnosis: "",
    treatment: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // ── Add prescription modal ───────────────────────────────
  const [prescriptionRecordId, setPrescriptionRecordId] =
    useState<number | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicineName: "",
    dosage: "",
    duration: "",
    instructions: "",
  });
  const [addingPrescription, setAddingPrescription] =
    useState(false);
  const [prescriptionError, setPrescriptionError] = useState("");

  // ── Delete prescription ──────────────────────────────────
  const [deletePrescriptionTarget, setDeletePrescriptionTarget] =
    useState<{ id: number; recordId: number } | null>(null);
  const [deletingPrescription, setDeletingPrescription] =
    useState(false);

  // ── Load doctor's completed appointments ─────────────────
  useEffect(() => {
    if (!doctor?.id) return;

    async function load() {
      setLoading(true);
      try {
        const data = await getAppointmentsByDoctor(
          doctor!.id,
          0,
          100
        );
        // Only completed appointments have records
        const completed = data.content.filter(
          (a: AppointmentResponse) => a.status === "COMPLETED"
        );
        setAppointments(completed);
      } catch {
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [doctor]);

  // ── Toggle expand — load record + prescriptions ──────────
 async function toggleExpand(appointmentId: number) {
  if (expandedId === appointmentId) {
    setExpandedId(null);
    return;
  }

  setExpandedId(appointmentId);
  if (records[appointmentId]) return;

  setLoadingRecord(appointmentId);
  try {
    const record = await getRecordByAppointment(appointmentId);
    setRecords((prev) => ({ ...prev, [appointmentId]: record }));

    const rx = await getPrescriptionsByRecord(record.id);
    setPrescriptions((prev) => ({
      ...prev,
      [record.id]: rx,
    }));

    const appt = appointments.find(
      (a) => a.id === appointmentId
    );
    if (appt?.patientId) {
      setLoadingFiles(appointmentId);
      try {
        const patientFiles = await getPatientFiles(
          appt.patientId
        );
        setFiles((prev) => ({
          ...prev,
          [appointmentId]: patientFiles as unknown as PatientFile[],
        }));
      } catch {
        setFiles((prev) => ({
          ...prev,
          [appointmentId]: [] as PatientFile[],
        }));
      } finally {
        setLoadingFiles(null);
      }
    }
  } catch {
    showToast(
      "No medical record found for this appointment.",
      "error"
    );
    setExpandedId(null);
  } finally {
    setLoadingRecord(null);
  }
}


  // ── Open edit record ─────────────────────────────────────
  function openEditRecord(record: MedicalRecord) {
    setEditRecord(record);
    setEditForm({
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
    });
    setEditError("");
  }

  // ── Save record ──────────────────────────────────────────
  async function handleSaveRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!editRecord) return;
    setEditError("");
    setSaving(true);
    try {
      const updated = await updateMedicalRecord(
        editRecord.id,
        editForm
      );
      setRecords((prev) => ({
        ...prev,
        [editRecord.appointmentId]: updated,
      }));
      showToast("Record updated.", "success");
      setEditRecord(null);
    } catch (err) {
      setEditError(
        apiErrorMessage(
          err,
          "Couldn't update record."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Add prescription ─────────────────────────────────────
  async function handleAddPrescription(e: React.FormEvent) {
    e.preventDefault();
    if (!prescriptionRecordId) return;
    setPrescriptionError("");
    setAddingPrescription(true);
    try {
      const newRx = await addPrescription({
        medicalRecordId: prescriptionRecordId,
        ...prescriptionForm,
      });
      setPrescriptions((prev) => ({
        ...prev,
        [prescriptionRecordId]: [
          ...(prev[prescriptionRecordId] || []),
          newRx,
        ],
      }));
      showToast("Prescription added.", "success");
      setPrescriptionRecordId(null);
      setPrescriptionForm({
        medicineName: "",
        dosage: "",
        duration: "",
        instructions: "",
      });
    } catch (err) {
      setPrescriptionError(
        apiErrorMessage(err, "Couldn't add prescription.")
      );
    } finally {
      setAddingPrescription(false);
    }
  }

  // ── Delete prescription ──────────────────────────────────
  async function handleDeletePrescription() {
    if (!deletePrescriptionTarget) return;
    setDeletingPrescription(true);
    try {
      await deletePrescription(deletePrescriptionTarget.id);
      setPrescriptions((prev) => ({
        ...prev,
        [deletePrescriptionTarget.recordId]: prev[
          deletePrescriptionTarget.recordId
        ].filter((rx) => rx.id !== deletePrescriptionTarget.id),
      }));
      showToast("Prescription deleted.", "success");
      setDeletePrescriptionTarget(null);
    } catch {
      showToast("Couldn't delete prescription.", "error");
    } finally {
      setDeletingPrescription(false);
    }
  }

async function handleDownload(
  fileId: number,
  downloadUrl: string,
  originalName: string
) {
  setDownloading(fileId);
  try {
    const storedFileName = downloadUrl.split("/").pop();

    await downloadFileWithAuth(
      storedFileName!,
      originalName
    );
  } catch {
    showToast("Couldn't download file.", "error");
  } finally {
    setDownloading(null);
  }
}



  return (
    <>
      <Topbar
        title="Medical Records"
        subtitle="View and manage your patients' records"
        profileHref="/doctor/dashboard"
      />

      <div className="space-y-4 px-6 pb-10 lg:px-10">

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No completed appointments"
            description="Medical records will appear here after appointments are completed."
          />
        ) : (
          appointments.map((a) => {
            const isExpanded = expandedId === a.id;
            const record = records[a.id];
            const rxList = record
              ? prescriptions[record.id] || []
              : [];

            return (
              <Card key={a.id} className="p-0 overflow-hidden">
                {/* ── Header ─────────────────────────────── */}
                <button
                  onClick={() => toggleExpand(a.id)}
                  className="flex w-full items-center gap-4
                             px-5 py-4 text-left
                             hover:bg-ink-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold
                                  text-ink-900">
                      {a.patientName}
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatDate(a.appointmentDate)} ·{" "}
                      {a.departmentName}
                    </p>
                  </div>
                  <Badge status={a.status}>
                    {a.status}
                  </Badge>
                  {loadingRecord === a.id ? (
                    <div className="h-4 w-4 animate-spin
                                    rounded-full border-2
                                    border-brand-500
                                    border-t-transparent" />
                  ) : isExpanded ? (
                    <ChevronUp className="h-4 w-4
                                         text-ink-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4
                                           text-ink-400" />
                  )}
                </button>

                {/* ── Expanded content ─────────────────── */}
                {isExpanded && record && (
                  <div className="border-t border-ink-100
                                  px-5 py-4 space-y-4">

                    {/* Record details */}
                    <div className="flex items-start
                                    justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <div>
                          <p className="text-xs text-ink-500">
                            Diagnosis
                          </p>
                          <p className="text-sm font-medium
                                        text-ink-900">
                            {record.diagnosis}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-500">
                            Treatment
                          </p>
                          <p className="text-sm font-medium
                                        text-ink-900">
                            {record.treatment}
                          </p>
                        </div>
                        {record.notes && (
                          <div>
                            <p className="text-xs text-ink-500">
                              Notes
                            </p>
                            <p className="text-sm text-ink-700">
                              {record.notes}
                            </p>
                          </div>
                        )}

                        <div>
                            <p className="text-xs font-semibold uppercase
                                            tracking-wide text-ink-500 mb-2
                                            flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                Patient Files
                                {loadingFiles === a.id && (
                                <span className="h-3 w-3 animate-spin rounded-full
                                                border-2 border-brand-500
                                                border-t-transparent" />
                                )}
                            </p>

                            {(() => {
                                const patientFiles = files[a.id] || [];
                                if (patientFiles.length === 0) {
                                return (
                                    <p className="text-xs text-ink-400 italic">
                                    No files uploaded by this patient.
                                    </p>
                                );
                                }
                                return (
                                <div className="space-y-2">
                                    {patientFiles.map((f) => (
                                    <div
                                        key={f.id}
                                        className="flex items-center gap-3
                                                rounded-xl bg-ink-50 px-3.5 py-3"
                                    >
                                        {/* File icon */}
                                        {f.contentType?.startsWith("image") ? (
                                        <Image className="h-4 w-4 text-brand-600
                                                            shrink-0" />
                                        ) : (
                                        <File className="h-4 w-4 text-ink-400
                                                        shrink-0" />
                                        )}

                                        {/* File info */}
                                        <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium
                                                        text-ink-900 truncate">
                                            {f.originalFileName}
                                        </p>
                                        <p className="text-xs text-ink-500">
                                            {f.fileType} ·{" "}
                                            {(f.fileSize / 1024).toFixed(1)} KB
                                        </p>
                                        {f.description && (
                                            <p className="text-xs text-ink-400">
                                            {f.description}
                                            </p>
                                        )}
                                        </div>

                                        {/* Download */}
                                        <button
                                        onClick={() =>
                                            handleDownload(
                                                f.id,
                                                f.downloadUrl,   
                                                f.originalFileName
                                                )
                                             }
                                        disabled={downloading === f.id}
                                        className="flex h-8 w-8 shrink-0 items-center
                                                    justify-center rounded-lg text-ink-400
                                                    hover:bg-brand-50 hover:text-brand-700
                                                    transition-colors disabled:opacity-50"
                                        >
                                        {downloading === f.id ? (
                                            <div className="h-3.5 w-3.5 animate-spin rounded-full
                                                            border-2 border-brand-500
                                                            border-t-transparent" />
                                        ) : (
                                            <Download className="h-3.5 w-3.5" />
                                        )}
                                        </button>
                                    </div>
                                    ))}
                                </div>
                                );
                            })()}
                            </div>
                      </div>

                      {/* ✅ Edit record button */}
                      <button
                        onClick={() => openEditRecord(record)}
                        className="flex h-8 w-8 shrink-0
                                   items-center justify-center
                                   rounded-lg text-ink-400
                                   hover:bg-brand-50
                                   hover:text-brand-700
                                   transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Prescriptions */}
                    <div>
                      <div className="flex items-center
                                      justify-between mb-2">
                        <p className="text-xs font-semibold
                                      uppercase tracking-wide
                                      text-ink-500 flex
                                      items-center gap-1.5">
                          <Pill className="h-3.5 w-3.5" />
                          Prescriptions ({rxList.length})
                        </p>
                        {/* ✅ Add prescription */}
                        <button
                          onClick={() =>
                            setPrescriptionRecordId(record.id)
                          }
                          className="flex items-center gap-1
                                     text-xs font-medium
                                     text-brand-700
                                     hover:text-brand-900"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </button>
                      </div>

                      {rxList.length === 0 ? (
                        <p className="text-xs text-ink-400
                                      italic">
                          No prescriptions added yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {rxList.map((rx) => (
                            <div
                              key={rx.id}
                              className="flex items-start
                                         justify-between
                                         rounded-xl bg-ink-50
                                         px-3.5 py-3"
                            >
                              <div>
                                <p className="text-sm
                                              font-semibold
                                              text-ink-900">
                                  {rx.medicineName}
                                </p>
                                <p className="text-xs
                                              text-ink-500">
                                  {rx.dosage} · {rx.duration}
                                </p>
                                {rx.instructions && (
                                  <p className="text-xs
                                                text-ink-600
                                                mt-0.5">
                                    {rx.instructions}
                                  </p>
                                )}
                              </div>
                              {/* ✅ Delete prescription */}
                              <button
                                onClick={() =>
                                  setDeletePrescriptionTarget({
                                    id: rx.id,
                                    recordId: record.id,
                                  })
                                }
                                className="ml-3 flex h-7 w-7
                                           shrink-0 items-center
                                           justify-center
                                           text-red-300
                                           rounded-lg text-ink-400
                                           hover:bg-red-50
                                           hover:text-red-600
                                           transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ✅ Edit record modal ─────────────────────────────── */}
      <Modal
        open={editRecord !== null}
        onClose={() => setEditRecord(null)}
        title="Edit Medical Record"
      >
        <form onSubmit={handleSaveRecord} className="space-y-4">
          <Input
            label="Diagnosis"
            value={editForm.diagnosis}
            onChange={(e) =>
              setEditForm((f) => ({
                ...f,
                diagnosis: e.target.value,
              }))
            }
            required
          />
          <Input
            label="Treatment"
            value={editForm.treatment}
            onChange={(e) =>
              setEditForm((f) => ({
                ...f,
                treatment: e.target.value,
              }))
            }
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">
              Notes{" "}
              <span className="text-ink-400">(optional)</span>
            </label>
            <textarea
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  notes: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-xl border border-ink-100
                         bg-white px-3.5 py-2.5 text-sm
                         text-ink-900 focus:outline-none
                         focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {editError && <Alert tone="error">{editError}</Alert>}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setEditRecord(null)}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={saving}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* ✅ Add prescription modal ───────────────────────── */}
      <Modal
        open={prescriptionRecordId !== null}
        onClose={() => setPrescriptionRecordId(null)}
        title="Add Prescription"
      >
        <form
          onSubmit={handleAddPrescription}
          className="space-y-4"
        >
          <Input
            label="Medicine name"
            value={prescriptionForm.medicineName}
            onChange={(e) =>
              setPrescriptionForm((f) => ({
                ...f,
                medicineName: e.target.value,
              }))
            }
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Dosage"
              placeholder="e.g. 500mg"
              value={prescriptionForm.dosage}
              onChange={(e) =>
                setPrescriptionForm((f) => ({
                  ...f,
                  dosage: e.target.value,
                }))
              }
              required
            />
            <Input
              label="Duration"
              placeholder="e.g. 7 days"
              value={prescriptionForm.duration}
              onChange={(e) =>
                setPrescriptionForm((f) => ({
                  ...f,
                  duration: e.target.value,
                }))
              }
              required
            />
          </div>
          <Input
            label="Instructions (optional)"
            placeholder="e.g. After meals"
            value={prescriptionForm.instructions}
            onChange={(e) =>
              setPrescriptionForm((f) => ({
                ...f,
                instructions: e.target.value,
              }))
            }
          />
          {prescriptionError && (
            <Alert tone="error">{prescriptionError}</Alert>
          )}
          <Button
            type="submit"
            className="w-full"
            loading={addingPrescription}
          >
            <Plus className="h-4 w-4" />
            Add Prescription
          </Button>
        </form>
      </Modal>

      {/* ✅ Delete prescription confirm ──────────────────── */}
      <Modal
        open={deletePrescriptionTarget !== null}
        onClose={() => setDeletePrescriptionTarget(null)}
        title="Delete Prescription"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center
                            justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm text-ink-600">
              Are you sure you want to delete this prescription?
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeletePrescriptionTarget(null)}
              disabled={deletingPrescription}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              loading={deletingPrescription}
              onClick={handleDeletePrescription}
            >
              <Trash2 className="h-4 w-4 text-red" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
