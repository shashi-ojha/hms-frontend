"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { DepartmentResponse, DoctorResponse } from "@/lib/types";
import { createDoctor, onboardDoctor, updateDoctor, apiErrorMessage } from "@/lib/api";

export function DoctorFormModal({
  open,
  doctor,
  departments,
  onClose,
  onSaved,
}: {
  open: boolean;
  doctor: DoctorResponse | null;
  departments: DepartmentResponse[];
  onClose: () => void;
  onSaved: () => void;
}) {
  // Login details — only used when creating a new doctor
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Doctor profile fields — used for both create and edit
  const [departmentId, setDepartmentId] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setDepartmentId(
        departments.find((d) => d.name === doctor?.departmentName)?.id
          ? String(departments.find((d) => d.name === doctor?.departmentName)!.id)
          : ""
      );
      setSpecialization(doctor?.specialization || "");
      setExperienceYears(doctor ? String(doctor.experienceYears) : "");
      setConsultationFee(doctor ? String(doctor.consultationFee) : "");
      setBio(doctor?.bio || "");
      setError("");
    }
  }, [open, doctor, departments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (doctor) {
        await updateDoctor(doctor.id, {
          userId: doctor.userId,
          departmentId: Number(departmentId),
          specialization,
          experienceYears: Number(experienceYears),
          consultationFee: Number(consultationFee),
          bio,
        });
      } else {
        await onboardDoctor({
          name,
          email,
          password,
          phone,
          departmentId: Number(departmentId),
          specialization,
          experienceYears: Number(experienceYears),
          consultationFee: Number(consultationFee),
          bio,
        });
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the doctor."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={doctor ? "Edit doctor" : "Add doctor"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!doctor && (
          <>
            <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-xs text-brand-800">
              This creates the doctor's login account and profile together.
              Share the email + password with them so they can sign in.
            </div>
            <Input
              label="Full name"
              placeholder="Dr. Ananya Rao"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="email"
                label="Email"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="tel"
                label="Phone"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <Input
              type="password"
              label="Temporary password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <hr className="border-ink-100" />
          </>
        )}

        <Select
          label="Department"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          required
        >
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Input
          label="Specialization"
          placeholder="e.g. Interventional Cardiology"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            label="Experience (years)"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            required
          />
          <Input
            type="number"
            label="Consultation fee (₹)"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-700">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" className="w-full" loading={loading}>
          {doctor ? "Save changes" : "Create doctor"}
        </Button>
      </form>
    </Modal>
  );
}