"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Plus, Pencil, Trash2 } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DoctorFormModal } from "@/components/DoctorFormModal";
import { useToast } from "@/lib/toast-context";
import { getAllDoctors, getDepartments, deleteDoctor } from "@/lib/api";
import { DepartmentResponse, DoctorResponse } from "@/lib/types";
import { formatCurrency, getDisplayName, initials } from "@/lib/format";

export default function DoctorsManagePage() {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoctorResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [doctorsData, deptData] = await Promise.all([
        getAllDoctors(),
        getDepartments(),
      ]);
      setDoctors(doctorsData);
      setDepartments(deptData);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(d: DoctorResponse) {
    setEditing(d);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoctor(deleteTarget.id);
      showToast("Doctor removed.", "success");
      await load();
    } catch {
      showToast("Couldn't delete this doctor. They may have appointments on file.", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <Topbar title="Doctors" subtitle="Manage doctor profiles" profileHref="/admin/dashboard" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add doctor
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No doctors yet"
            description="Add your first doctor to start accepting bookings."
            action={<Button onClick={openCreate}>Add doctor</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <Card key={d.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
                      {initials(d.doctorName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {getDisplayName(d.doctorName, "DOCTOR")}
                      </p>
                      <p className="truncate text-xs text-ink-500">{d.specialization}</p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(d)}
                      className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(d)}
                      className="rounded-lg p-1.5 text-ink-500 hover:bg-coral-50 hover:text-coral-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                  <Badge tone="slate">{d.departmentName}</Badge>
                  <Badge tone={d.available ? "teal" : "slate"}>
                    {d.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-sm">
                  <span className="text-ink-500">{d.experienceYears} yrs exp</span>
                  <span className="font-display font-semibold text-ink-900">
                    {formatCurrency(d.consultationFee)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DoctorFormModal
        open={formOpen}
        doctor={editing}
        departments={departments}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          showToast(editing ? "Doctor updated." : "Doctor added.", "success");
          load();
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this doctor?"
        description={`This will remove "${deleteTarget?.doctorName}" from the system.`}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}