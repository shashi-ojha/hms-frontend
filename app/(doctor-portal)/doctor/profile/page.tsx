"use client";

import { Award, Briefcase, Clock, IndianRupee, Mail, Phone, Stethoscope } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatTime, initials } from "@/lib/format";

export default function DoctorProfilePage() {
  const { user, doctor } = useAuth();

  const fields = [
    { icon: Mail, label: "Email", value: doctor?.email || user?.email },
    { icon: Phone, label: "Phone", value: doctor?.phone || user?.phone },
    { icon: Stethoscope, label: "Department", value: doctor?.departmentName },
    { icon: Briefcase, label: "Specialization", value: doctor?.specialization },
    { icon: Award, label: "Experience", value: doctor ? `${doctor.experienceYears} years` : "—" },
    {
      icon: IndianRupee,
      label: "Consultation fee",
      value: doctor ? formatCurrency(doctor.consultationFee) : "—",
    },
    {
      icon: Clock,
      label: "Working hours",
      value: doctor
        ? `${formatTime(doctor.workStartTime)} – ${formatTime(doctor.workEndTime)} (${doctor.slotDurationMinutes}-min slots)`
        : "—",
    },
  ];

  return (
    <>
      <Topbar title="My profile" subtitle="Your professional details" profileHref="/doctor/profile" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <Card className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-xl font-semibold text-white">
            {initials(user?.name || "")}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Dr. {user?.name}
            </h2>
            <Badge tone={doctor?.available ? "teal" : "slate"} className="mt-1.5">
              {doctor?.available ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">
            Professional details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-ink-500">{label}</p>
                  <p className="truncate text-sm font-medium text-ink-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {doctor?.bio && (
          <Card>
            <h3 className="mb-2 font-display text-base font-semibold text-ink-900">
              Bio
            </h3>
            <p className="text-sm text-ink-700">{doctor.bio}</p>
          </Card>
        )}
      </div>
    </>
  );
}