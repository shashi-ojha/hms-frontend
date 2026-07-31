"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDepartments, searchAllAppointments } from "@/lib/api";
import { AppointmentResponse, AppointmentStatus, DepartmentResponse } from "@/lib/types";
import { formatDate, formatTime, initials } from "@/lib/format";

const PAGE_SIZE = 15;
const statuses: AppointmentStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export function AppointmentsOverview() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await searchAllAppointments({
        status: (status || undefined) as AppointmentStatus | undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: PAGE_SIZE,
      });
      setAppointments(data.content);
      setTotalPages(data.totalPages || 1);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    load();
  }

  return (
    <div className="space-y-6 px-6 pb-10 lg:px-10">
      <form
        onSubmit={handleFilter}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-5"
      >
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Button type="submit">Apply filters</Button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments found"
          description="Try adjusting the filters above."
        />
      ) : (
        <>
          <div className="space-y-3">
            {appointments.map((a) => (
              <Card key={a.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                    {initials(a.patientName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{a.patientName}</p>
                    <p className="text-xs text-ink-500">
                      with {a.doctorName} · {a.departmentName}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
                  <span>{formatDate(a.appointmentDate)}</span>
                  <span>{formatTime(a.appointmentTime)}</span>
                  <Badge status={a.status}>{a.status}</Badge>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="text-sm text-ink-500">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}