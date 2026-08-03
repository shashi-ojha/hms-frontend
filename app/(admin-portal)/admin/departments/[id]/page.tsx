"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Stethoscope,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import {
  getDepartmentById,
  getDoctorsByDepartment,
} from "@/lib/api";
import { DepartmentResponse, DoctorResponse } from "@/lib/types";
import { formatCurrency, initials } from "@/lib/format";

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deptId = Number(params.id);

  const [department, setDepartment] =
    useState<DepartmentResponse | null>(null);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        // ✅ Load department detail
        const dept = await getDepartmentById(deptId);
        setDepartment(dept);

        // ✅ Load doctors in this department
        const docs = await getDoctorsByDepartment(deptId);
        setDoctors(docs);
      } catch {
        setError("Couldn't load department details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [deptId]);

  return (
    <>
      <Topbar
        title={department?.name || "Department"}
        subtitle="Department details and doctors"
        profileHref="/admin/dashboard"
      />

      <div className="space-y-6 px-6 pb-10 lg:px-10">

        {/* Back button */}
        <button
          onClick={() => router.push("/admin/departments")}
          className="flex items-center gap-1.5 text-sm
                     text-ink-500 hover:text-ink-900
                     transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to departments
        </button>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <Alert tone="error">{error}</Alert>
        ) : department ? (
          <>
            {/* ── Department info card ──────────────────── */}
            <Card>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0
                                items-center justify-center
                                rounded-2xl bg-brand-100">
                  <Building2 className="h-7 w-7
                                       text-brand-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-lg
                                   font-semibold text-ink-900">
                      {department.name}
                    </h2>
                    {department.active ? (
                      <span className="flex items-center
                                       gap-1 rounded-full
                                       bg-green-100 px-2 py-0.5
                                       text-xs font-medium
                                       text-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center
                                       gap-1 rounded-full
                                       bg-red-100 px-2 py-0.5
                                       text-xs font-medium
                                       text-red-600">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                  {department.description && (
                    <p className="mt-1 text-sm text-ink-700">
                      {department.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-ink-50
                                px-4 py-3 text-center">
                  <p className="text-xl font-semibold
                                text-ink-900">
                    {doctors.length}
                  </p>
                  <p className="text-xs text-ink-500">
                    Total doctors
                  </p>
                </div>
                <div className="rounded-xl bg-green-50
                                px-4 py-3 text-center">
                  <p className="text-xl font-semibold
                                text-green-700">
                    {doctors.filter((d) => d.available).length}
                  </p>
                  <p className="text-xs text-ink-500">
                    Available now
                  </p>
                </div>
              </div>
            </Card>

            {/* ── Doctors in department ─────────────────── */}
            <Card>
              <h3 className="mb-4 flex items-center gap-2
                             font-display text-base
                             font-semibold text-ink-900">
                <Stethoscope className="h-5 w-5
                                       text-brand-700" />
                Doctors ({doctors.length})
              </h3>

              {doctors.length === 0 ? (
                <p className="text-sm text-ink-500 italic">
                  No doctors assigned to this department yet.
                </p>
              ) : (
                <div className="divide-y divide-ink-100">
                  {doctors.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3
                                 py-3 first:pt-0 last:pb-0"
                    >
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0
                                      items-center justify-center
                                      rounded-full bg-brand-700
                                      text-xs font-semibold
                                      text-white">
                        {initials(d.doctorName)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold
                                      text-ink-900 truncate">
                          {d.doctorName}
                        </p>
                        <p className="text-xs text-ink-500">
                          {d.specialization} ·{" "}
                          {d.experienceYears} yrs exp
                        </p>
                      </div>

                      {/* Fee + availability */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold
                                      text-ink-900">
                          {formatCurrency(d.consultationFee)}
                        </p>
                        <Badge
                          tone={
                            d.available ? "teal" : "slate"
                          }
                        >
                          {d.available
                            ? "Available"
                            : "Unavailable"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </>
  );
}
