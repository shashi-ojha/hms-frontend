"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Droplet,
  Phone,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  X,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/lib/toast-context";
import {
  getAllPatients,
  updatePatient,
  deletePatient,
  apiErrorMessage,
} from "@/lib/api";
import { PatientResponse } from "@/lib/types";
import { initials } from "@/lib/format";

const bloodGroups = [
  "A_POSITIVE", "A_NEGATIVE",
  "B_POSITIVE", "B_NEGATIVE",
  "AB_POSITIVE", "AB_NEGATIVE",
  "O_POSITIVE", "O_NEGATIVE",
];

export default function AdminPatientsPage() {
  const { showToast } = useToast();

  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Edit modal ───────────────────────────────────────────
  const [editTarget, setEditTarget] =
    useState<PatientResponse | null>(null);
  const [editForm, setEditForm] = useState({
    dateOfBirth: "",
    bloodGroup: "",
    address: "",
    emergencyContactName: "",
    emergencyContact: "",
    medicalHistory: "",
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // ── Delete modal ─────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] =
    useState<PatientResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  async function load() {
    setLoading(true);
    try {
      const data = await getAllPatients(0, 200);
      setPatients(data.content);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ── Open edit modal ──────────────────────────────────────
  function openEdit(p: PatientResponse) {
    setEditTarget(p);
    setEditForm({
      dateOfBirth: p.dateOfBirth || "",
      bloodGroup: p.bloodGroup || "",
      address: p.address || "",
      emergencyContactName: p.emergencyContactName || "",
      emergencyContact: p.emergencyContact || "",
      medicalHistory: p.medicalHistory || "",
    });
    setEditError("");
  }

  function updateField(
    key: keyof typeof editForm,
    value: string
  ) {
    setEditForm((f) => ({ ...f, [key]: value }));
  }

  // ── Save edit ────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError("");
    setSaving(true);
    try {
      await updatePatient(editTarget.id, editForm);
      showToast("Patient updated successfully.", "success");
      setEditTarget(null);
      await load();
    } catch (err) {
      setEditError(
        apiErrorMessage(
          err,
          "Couldn't update patient. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePatient(deleteTarget.id);
      showToast("Patient deleted.", "success");
      setDeleteTarget(null);
      await load();
    } catch {
      showToast("Couldn't delete patient.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Topbar
        title="Patients"
        subtitle={`${patients.length} registered patients`}
        profileHref="/admin/dashboard"
      />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-4
                          sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients yet"
            description="Registered patients will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4
                          sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((p) => (
              <Card
                key={p.id}
                className="flex items-center gap-3"
              >
                {/* Avatar */}
                <div className="flex h-11 w-11 flex-shrink-0
                                items-center justify-center
                                rounded-full bg-brand-700
                                text-sm font-semibold text-white">
                  {initials(p.patientName)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold
                                text-ink-900">
                    {p.patientName}
                  </p>
                  <div className="mt-0.5 flex items-center
                                  gap-3 text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <Droplet className="h-3 w-3" />
                      {p.bloodGroup?.replace("_", " ") || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {p.phone}
                    </span>
                  </div>
                </div>

                {/* ✅ Action buttons */}
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex h-8 w-8 items-center
                               justify-center rounded-lg
                               text-ink-400 hover:bg-brand-50
                               hover:text-brand-700
                               transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="flex h-8 w-8 items-center
                               justify-center rounded-lg
                               text-ink-400 hover:bg-red-50
                               hover:text-red-600
                               transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Edit patient modal ───────────────────────────── */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`Edit — ${editTarget?.patientName}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="date"
              label="Date of birth"
              max={today}
              value={editForm.dateOfBirth}
              onChange={(e) =>
                updateField("dateOfBirth", e.target.value)
              }
            />
            <Select
              label="Blood group"
              value={editForm.bloodGroup}
              onChange={(e) =>
                updateField("bloodGroup", e.target.value)
              }
            >
              <option value="">Select blood group</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Address"
            value={editForm.address}
            onChange={(e) =>
              updateField("address", e.target.value)
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Emergency contact name"
              value={editForm.emergencyContactName}
              onChange={(e) =>
                updateField(
                  "emergencyContactName",
                  e.target.value
                )
              }
            />
            <Input
              type="tel"
              label="Emergency contact number"
              value={editForm.emergencyContact}
              onChange={(e) =>
                updateField("emergencyContact", e.target.value)
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">
              Medical history{" "}
              <span className="text-ink-400">(optional)</span>
            </label>
            <textarea
              value={editForm.medicalHistory}
              onChange={(e) =>
                updateField("medicalHistory", e.target.value)
              }
              rows={3}
              className="w-full rounded-xl border border-ink-100
                         bg-white px-3.5 py-2.5 text-sm
                         text-ink-900 focus:outline-none
                         focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {editError && (
            <Alert tone="error">{editError}</Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setEditTarget(null)}
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
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ✅ Delete confirm modal ──────────────────────────── */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Patient"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0
                              items-center justify-center
                              rounded-xl bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-ink-600">
                Are you sure you want to delete{" "}
                <strong>{deleteTarget.patientName}</strong>?
                This will remove all their data permanently.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                loading={deleting}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
