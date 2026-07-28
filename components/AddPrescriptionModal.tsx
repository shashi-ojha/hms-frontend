"use client";

import { useState } from "react";
import { Pill } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createPrescription, apiErrorMessage } from "@/lib/api";

export function AddPrescriptionModal({
  recordId,
  onClose,
  onAdded,
}: {
  recordId: number | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recordId) return;
    setError("");
    setLoading(true);
    try {
      await createPrescription({
        medicalRecordId: recordId,
        medicineName,
        dosage,
        duration,
        instructions,
      });
      onAdded();
      setMedicineName("");
      setDosage("");
      setDuration("");
      setInstructions("");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't add prescription. Try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={recordId !== null} onClose={onClose} title="Add prescription">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Medicine name"
          placeholder="e.g. Amoxicillin"
          value={medicineName}
          onChange={(e) => setMedicineName(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dosage"
            placeholder="e.g. 500mg twice daily"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            required
          />
          <Input
            label="Duration"
            placeholder="e.g. 5 days"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>
        <Input
          label="Instructions (optional)"
          placeholder="e.g. Take after food"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" className="w-full" loading={loading}>
          <Pill className="h-4 w-4" />
          Add prescription
        </Button>
      </form>
    </Modal>
  );
}