"use client";

import {
  Droplet,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Cake,
  Info,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/lib/auth-context";
import { formatDate, initials } from "@/lib/format";

export default function ProfilePage() {
  const { user, patient } = useAuth();

  const fields = [
    { icon: Mail, label: "Email", value: patient?.email || user?.email },
    { icon: Phone, label: "Phone", value: patient?.phone || user?.phone },
    {
      icon: Cake,
      label: "Date of birth",
      value: patient?.dateOfBirth ? formatDate(patient.dateOfBirth) : "—",
    },
    {
      icon: Droplet,
      label: "Blood group",
      value: patient?.bloodGroup?.replace("_", " ") || "—",
    },
    { icon: MapPin, label: "Address", value: patient?.address || "—" },
    {
      icon: ShieldAlert,
      label: "Emergency contact",
      value: patient
        ? `${patient.emergencyContactName} · ${patient.emergencyContact}`
        : "—",
    },
  ];

  return (
    <>
      <Topbar title="My profile" subtitle="Your personal and medical details" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <Card className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-xl font-semibold text-white">
            {initials(user?.name || "")}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">
              {user?.name}
            </h2>
            <p className="text-sm text-ink-500">Patient</p>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">
            Personal details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-ink-500">{label}</p>
                  <p className="truncate text-sm font-medium text-ink-900">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {patient?.medicalHistory && (
          <Card>
            <h3 className="mb-2 font-display text-base font-semibold text-ink-900">
              Medical history
            </h3>
            <p className="text-sm text-ink-700">{patient.medicalHistory}</p>
          </Card>
        )}

        <Alert tone="info">
          <span className="flex items-start gap-1">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            To update these details, please contact the reception desk.
          </span>
        </Alert>
      </div>
    </>
  );
}