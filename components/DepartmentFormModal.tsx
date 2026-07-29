"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { DepartmentResponse } from "@/lib/types";
import { createDepartment, updateDepartment, apiErrorMessage } from "@/lib/api";

export function DepartmentFormModal({
  open,
  department,
  onClose,
  onSaved,
}: {
  open: boolean;
  department: DepartmentResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(department?.name || "");
      setDescription(department?.description || "");
      setError("");
    }
  }, [open, department]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (department) {
        await updateDepartment(department.id, { name, description, active: true });
      } else {
        await createDepartment({ name, description, active: true });
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the department."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={department ? "Edit department" : "Add department"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g. Cardiology"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" className="w-full" loading={loading}>
          {department ? "Save changes" : "Add department"}
        </Button>
      </form>
    </Modal>
  );
}