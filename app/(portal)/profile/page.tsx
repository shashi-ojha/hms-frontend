"use client";

import { useEffect, useState } from "react";
import {
  Droplet,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Cake,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  getMyPatientProfile,
  updateMyPatientProfile,
  apiErrorMessage,
} from "@/lib/api";
import { formatDate, initials } from "@/lib/format";

const bloodGroups = [
  "A_POSITIVE", "A_NEGATIVE",
  "B_POSITIVE", "B_NEGATIVE",
  "AB_POSITIVE", "AB_NEGATIVE",
  "O_POSITIVE", "O_NEGATIVE",
];

interface PatientProfile {
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  emergencyContactName: string;
  emergencyContact: string;
  medicalHistory: string;
  email: string;
  phone: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<PatientProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Edit form state
  const [form, setForm] = useState({
    dateOfBirth: "",
    bloodGroup: "",
    address: "",
    emergencyContactName: "",
    emergencyContact: "",
    medicalHistory: "",
  });

  const today = new Date().toISOString().split("T")[0];

  // ── Load profile ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getMyPatientProfile();
        setProfile(data);
        // Pre-fill edit form
        setForm({
          dateOfBirth: data.dateOfBirth || "",
          bloodGroup: data.bloodGroup || "",
          address: data.address || "",
          emergencyContactName: data.emergencyContactName || "",
          emergencyContact: data.emergencyContact || "",
          medicalHistory: data.medicalHistory || "",
        });
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Save profile ─────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await updateMyPatientProfile(form);
      setProfile(updated);
      setEditing(false);
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Couldn't update profile. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    // Reset form to current profile values
    if (profile) {
      setForm({
        dateOfBirth: profile.dateOfBirth || "",
        bloodGroup: profile.bloodGroup || "",
        address: profile.address || "",
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContact: profile.emergencyContact || "",
        medicalHistory: profile.medicalHistory || "",
      });
    }
    setEditing(false);
    setError("");
  }

  // ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Topbar
          title="My profile"
          subtitle="Your personal and medical details"
        />
        <div className="space-y-6 px-6 pb-10 lg:px-10">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="My profile"
        subtitle="Your personal and medical details"
      />

      <div className="space-y-6 px-6 pb-10 lg:px-10">

        {/* ── Avatar card ──────────────────────────────────── */}
        <Card className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center
                            justify-center rounded-2xl
                            bg-brand-700 text-xl font-semibold
                            text-white">
              {initials(user?.name || "")}
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold
                             text-ink-900">
                {user?.name}
              </h2>
              <p className="text-sm text-ink-500">Patient</p>
            </div>
          </div>

          {/* ✅ Edit toggle button */}
          {!editing ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancelEdit}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
        </Card>

        {/* ── View mode ────────────────────────────────────── */}
        {!editing && profile && (
          <>
            <Card>
              <h3 className="mb-4 font-display text-base
                             font-semibold text-ink-900">
                Personal details
              </h3>
              <div className="grid grid-cols-1 gap-4
                              sm:grid-cols-2">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    value: profile.email || user?.email,
                  },
                  {
                    icon: Phone,
                    label: "Phone",
                    value: profile.phone || user?.phone,
                  },
                  {
                    icon: Cake,
                    label: "Date of birth",
                    value: profile.dateOfBirth
                      ? formatDate(profile.dateOfBirth)
                      : "—",
                  },
                  {
                    icon: Droplet,
                    label: "Blood group",
                    value:
                      profile.bloodGroup?.replace("_", " ") ||
                      "—",
                  },
                  {
                    icon: MapPin,
                    label: "Address",
                    value: profile.address || "—",
                  },
                  {
                    icon: ShieldAlert,
                    label: "Emergency contact",
                    value:
                      profile.emergencyContactName &&
                      profile.emergencyContact
                        ? `${profile.emergencyContactName} · ${profile.emergencyContact}`
                        : "—",
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex h-8 w-8
                                    flex-shrink-0 items-center
                                    justify-center rounded-lg
                                    bg-ink-100 text-ink-500">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-ink-500">
                        {label}
                      </p>
                      <p className="truncate text-sm font-medium
                                    text-ink-900">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {profile.medicalHistory && (
              <Card>
                <h3 className="mb-2 font-display text-base
                               font-semibold text-ink-900">
                  Medical history
                </h3>
                <p className="text-sm text-ink-700">
                  {profile.medicalHistory}
                </p>
              </Card>
            )}
          </>
        )}

        {/* ✅ Edit mode ─────────────────────────────────────── */}
        {editing && (
          <Card>
            <h3 className="mb-4 font-display text-base
                           font-semibold text-ink-900">
              Edit profile
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4
                              sm:grid-cols-2">
                <Input
                  type="date"
                  label="Date of birth"
                  max={today}
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    update("dateOfBirth", e.target.value)
                  }
                />
                <Select
                  label="Blood group"
                  value={form.bloodGroup}
                  onChange={(e) =>
                    update("bloodGroup", e.target.value)
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
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />

              <div className="grid grid-cols-1 gap-4
                              sm:grid-cols-2">
                <Input
                  label="Emergency contact name"
                  value={form.emergencyContactName}
                  onChange={(e) =>
                    update("emergencyContactName", e.target.value)
                  }
                />
                <Input
                  type="tel"
                  label="Emergency contact number"
                  value={form.emergencyContact}
                  onChange={(e) =>
                    update("emergencyContact", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium
                                  text-ink-700">
                  Medical history{" "}
                  <span className="text-ink-400">(optional)</span>
                </label>
                <textarea
                  value={form.medicalHistory}
                  onChange={(e) =>
                    update("medicalHistory", e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-xl border
                             border-ink-100 bg-white px-3.5
                             py-2.5 text-sm text-ink-900
                             focus:outline-none focus:ring-2
                             focus:ring-brand-500"
                />
              </div>

              {error && <Alert tone="error">{error}</Alert>}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleCancelEdit}
                >
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
          </Card>
        )}
      </div>
    </>
  );
}
