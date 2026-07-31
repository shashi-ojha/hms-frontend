"use client";

import { useEffect, useState } from "react";
import { ChevronDown, FileText, Pill } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { PatientFilesSection } from "@/components/PatientFilesSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { getPatientHistory } from "@/lib/api";
import { MedicalRecordResponse } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function RecordsPage() {
  const { patient } = useAuth();
  const [records, setRecords] = useState<MedicalRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (!patient) return;
    getPatientHistory(patient.id)
      .then((data) =>
        setRecords(
          [...data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        )
      )
      .finally(() => setLoading(false));
  }, [patient]);

  return (
    <>
      <Topbar
        title="Medical records"
        subtitle="Diagnoses, treatments and prescriptions from your visits"
      />

      <div className="space-y-4 px-6 pb-10 lg:px-10">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No medical records yet"
            description="Once a doctor completes your visit, the diagnosis and treatment notes will appear here."
          />
        ) : (
          <div className="relative space-y-4 border-l-2 border-dashed border-ink-100 pl-6">
            {records.map((r) => {
              const open = openId === r.id;
              return (
                <div key={r.id} className="relative">
                  <span className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-white bg-brand-600" />
                  <Card className="p-0 overflow-hidden">
                    <button
                      onClick={() => setOpenId(open ? null : r.id)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink-900">
                          {r.diagnosis}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {r.doctorName} · {formatDate(r.createdAt)}
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 flex-shrink-0 text-ink-500 transition-transform",
                          open && "rotate-180"
                        )}
                      />
                    </button>

                    {open && (
                      <div className="space-y-4 border-t border-ink-100 px-5 py-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                            Treatment
                          </p>
                          <p className="mt-1 text-sm text-ink-700">
                            {r.treatment}
                          </p>
                        </div>
                        {r.notes && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                              Notes
                            </p>
                            <p className="mt-1 text-sm text-ink-700">
                              {r.notes}
                            </p>
                          </div>
                        )}
                        {r.prescriptions.length > 0 && (
                          <div>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                              <Pill className="h-3.5 w-3.5" />
                              Prescriptions
                            </p>
                            <div className="space-y-2">
                              {r.prescriptions.map((p) => (
                                <div
                                  key={p.id}
                                  className="rounded-xl bg-brand-50 px-3.5 py-2.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-ink-900">
                                      {p.medicineName}
                                    </p>
                                    <span className="text-xs font-medium text-brand-700">
                                      {p.dosage}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-xs text-ink-500">
                                    {p.duration}
                                    {p.instructions && ` · ${p.instructions}`}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {patient && (
          <PatientFilesSection patientId={patient.id} canUpload canDelete />
        )}
      </div>
    </>
  );
}