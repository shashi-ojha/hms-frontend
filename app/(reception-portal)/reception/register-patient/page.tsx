"use client";

import { useState } from "react";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { register, createPatientRecord, apiErrorMessage } from "@/lib/api";

const bloodGroups = [
  "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
  "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE",
];

export default function RegisterPatientPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    dateOfBirth: "",
    bloodGroup: "",
    address: "",
    emergencyContactName: "",
    emergencyContact: "",
    medicalHistory: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: "PATIENT",
      });
      await createPatientRecord({
        userId: auth.userId,
        dateOfBirth: form.dateOfBirth,
        bloodGroup: form.bloodGroup,
        address: form.address,
        emergencyContactName: form.emergencyContactName,
        emergencyContact: form.emergencyContact,
        medicalHistory: form.medicalHistory,
      });
      setSuccess(true);
      setForm({
        name: "", email: "", phone: "", password: "",
        dateOfBirth: "", bloodGroup: "", address: "",
        emergencyContactName: "", emergencyContact: "", medicalHistory: "",
      });
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't register this patient. Check the details and try again."));
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <Topbar title="Register Patient" subtitle="Set up a walk-in patient's account" profileHref="/reception/dashboard" />

      <div className="mx-auto max-w-2xl space-y-6 px-6 pb-10 lg:px-10">
        {success && (
          <Alert tone="success">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Patient registered. Share their email and password so they can log in.
            </span>
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Login details
            </p>
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                type="email"
                label="Email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
              <Input
                type="tel"
                label="Phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </div>
            <Input
              type="password"
              label="Temporary password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={6}
            />

            <hr className="border-ink-100" />
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Medical profile
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                type="date"
                label="Date of birth"
                max={today}
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                required
              />
              <Select
                label="Blood group"
                value={form.bloodGroup}
                onChange={(e) => update("bloodGroup", e.target.value)}
                required
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
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Emergency contact name"
                value={form.emergencyContactName}
                onChange={(e) => update("emergencyContactName", e.target.value)}
                required
              />
              <Input
                type="tel"
                label="Emergency contact number"
                value={form.emergencyContact}
                onChange={(e) => update("emergencyContact", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-700">
                Medical history (optional)
              </label>
              <textarea
                value={form.medicalHistory}
                onChange={(e) => update("medicalHistory", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && <Alert tone="error">{error}</Alert>}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              <UserPlus className="h-4 w-4" />
              Register patient
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}