"use client";

import { useEffect, useState } from "react";
import { Users, Droplet, Phone } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAllPatients } from "@/lib/api";
import { PatientResponse } from "@/lib/types";
import { initials } from "@/lib/format";

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPatients(0, 200)
      .then((data) => setPatients(data.content))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar title="Patients" subtitle={`${patients.length} registered patients`} profileHref="/admin/dashboard" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((p) => (
              <Card key={p.id} className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
                  {initials(p.patientName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {p.patientName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-500">
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
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}