"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DepartmentFormModal } from "@/components/DepartmentFormModal";
import { useToast } from "@/lib/toast-context";
import { getDepartments, deleteDepartment } from "@/lib/api";
import { DepartmentResponse } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function DepartmentsPage() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();

  async function load() {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch {
      setDepartments([]);
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

  function openEdit(d: DepartmentResponse) {
    setEditing(d);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDepartment(deleteTarget.id);
      showToast("Department deleted.", "success");
      await load();
    } catch {
      showToast("Couldn't delete — it may still have doctors assigned.", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <Topbar title="Departments" subtitle="Manage hospital departments" profileHref="/admin/dashboard" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add department
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Add your first department to start assigning doctors."
            action={<Button onClick={openCreate}>Add department</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <Card key={d.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() =>
                      router.push(`/admin/departments/${d.id}`)
                    } className="text-ink-700">
                      <Eye className="h-4 w-4" />
                    </button>
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
                <div>
                  <p className="text-sm font-semibold text-ink-900">{d.name}</p>
                  <p className="mt-1 text-xs text-ink-500">{d.description}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DepartmentFormModal
        open={formOpen}
        department={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          showToast(editing ? "Department updated." : "Department added.", "success");
          load();
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete department?"
        description={`This will permanently remove "${deleteTarget?.name}". This can't be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}