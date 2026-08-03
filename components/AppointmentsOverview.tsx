"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/lib/toast-context";
import {
  getDepartments,
  searchAllAppointments,
  getAppointmentById,
  deleteAppointment,
} from "@/lib/api";
import {
  AppointmentResponse,
  AppointmentStatus,
  DepartmentResponse,
} from "@/lib/types";
import { formatDate, formatTime, initials } from "@/lib/format";
import { AppointmentDetailModal } from "./AppointmentDetailModal";

const PAGE_SIZE = 15;
const statuses: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

interface Props {
  showDelete?: boolean; // ✅ Only admin sees delete
}

export function AppointmentsOverview({
  showDelete = false,
}: Props) {
  const { showToast } = useToast();

  const [appointments, setAppointments] = useState<
    AppointmentResponse[]
  >([]);
  const [departments, setDepartments] = useState<
    DepartmentResponse[]
  >([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Filters ──────────────────────────────────────────────
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ── Detail modal ─────────────────────────────────────────
  const [detailAppointment, setDetailAppointment] =
    useState<AppointmentResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Delete confirm modal ─────────────────────────────────
  const [deleteTarget, setDeleteTarget] =
    useState<AppointmentResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await searchAllAppointments({
        status: (status || undefined) as
          | AppointmentStatus
          | undefined,
        departmentId: departmentId
          ? Number(departmentId)
          : undefined,
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

  // ── View detail ──────────────────────────────────────────
  async function handleViewDetail(id: number) {
    setLoadingDetail(true);
    try {
      const data = await getAppointmentById(id);
      setDetailAppointment(data);
    } catch {
      showToast("Couldn't load appointment details.", "error");
    } finally {
      setLoadingDetail(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAppointment(deleteTarget.id);
      showToast("Appointment deleted.", "success");
      setDeleteTarget(null);
      await load();
    } catch {
      showToast("Couldn't delete appointment.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 px-6 pb-10 lg:px-10">

      {/* ── Filters ─────────────────────────────────────── */}
      <form
        onSubmit={handleFilter}
        className="grid grid-cols-1 gap-3 rounded-2xl border
                   border-ink-100 bg-white p-4 shadow-card
                   sm:grid-cols-2 lg:grid-cols-5"
      >
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <Button type="submit">Apply filters</Button>
      </form>

      {/* ── List ────────────────────────────────────────── */}
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
              <Card
                key={a.id}
                className="flex flex-col gap-3 sm:flex-row
                           sm:items-center sm:justify-between"
              >
                {/* Patient info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0
                                  items-center justify-center
                                  rounded-full bg-brand-700
                                  text-xs font-semibold text-white">
                    {initials(a.patientName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold
                                  text-ink-900">
                      {a.patientName}
                    </p>
                    <p className="text-xs text-ink-500">
                      with {a.doctorName} · {a.departmentName}
                    </p>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex flex-wrap items-center
                                gap-3 text-xs text-ink-500">
                  <span>{formatDate(a.appointmentDate)}</span>
                  <span>{formatTime(a.appointmentTime)}</span>
                  <Badge status={a.status}>{a.status}</Badge>

                  {/* View detail button */}
                  <button onClick={() => setSelectedId(a.id)}>
                    <Eye className="h-4 w-4" />
                  </button>

                  {/* Delete button — admin only */}
                  {showDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-500
                                 hover:bg-red-50"
                      onClick={() => setDeleteTarget(a)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center
                            gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
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
      {/* ✅ Delete confirm modal ──────────────────────────── */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Appointment"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0
                              items-center justify-center
                              rounded-xl bg-red-100">
                <AlertTriangle className="h-6 w-6
                                         text-red-600" />
              </div>
              <p className="text-sm text-ink-700">
                Are you sure you want to delete the appointment
                for{" "}
                <strong>{deleteTarget.patientName}</strong> on{" "}
                {formatDate(deleteTarget.appointmentDate)}?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                loading={deleting}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <AppointmentDetailModal
        appointmentId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
