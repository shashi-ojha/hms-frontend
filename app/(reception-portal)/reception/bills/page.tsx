"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  IndianRupee,
  Plus,
  Search,
  X,
  ChevronLeft,
  Eye,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/lib/toast-context";
import {
  getAllBills,
  getBillById,
  payBill,
  createBill,
  searchPatients,
  searchAllAppointments,
  apiErrorMessage,
} from "@/lib/api";
import {
  AppointmentResponse,
  BillResponse,
  PatientResponse,
} from "@/lib/types";
import { formatCurrency, formatDate, initials } from "@/lib/format";

const paymentMethods = ["CASH", "CARD", "UPI", "NET_BANKING"];

export default function ReceptionBillsPage() {
  const { showToast } = useToast();
  const [bills, setBills] = useState<BillResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Pay modal ────────────────────────────────────────────
  const [payTarget, setPayTarget] = useState<BillResponse | null>(null);
  const [method, setMethod] = useState("CASH");
  const [paying, setPaying] = useState(false);

  // ── Create modal ─────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);

  // ── Detail modal ─────────────────────────────────────────
  const [detailBill, setDetailBill] =
    useState<BillResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getAllBills(0, 200);
      setBills(data.content);
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ── View bill detail ─────────────────────────────────────
  async function handleViewDetail(billId: number) {
    setLoadingDetail(true);
    try {
      const data = await getBillById(billId);
      setDetailBill(data);
    } catch {
      showToast("Couldn't load bill details.", "error");
    } finally {
      setLoadingDetail(false);
    }
  }

  // ── Mark paid ────────────────────────────────────────────
  async function handlePay() {
    if (!payTarget) return;
    setPaying(true);
    try {
      await payBill(payTarget.id, method);
      showToast("Bill marked as paid.", "success");
      setPayTarget(null);
      await load();
    } catch {
      showToast("Couldn't update this bill.", "error");
    } finally {
      setPaying(false);
    }
  }

  const totalPending = bills
    .filter((b) => b.status === "PENDING")
    .reduce((s, b) => s + b.totalAmount, 0);

  return (
    <>
      <Topbar
        title="Bills"
        subtitle="Create and manage patient billing"
        profileHref="/reception/dashboard"
      />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row
                        sm:items-center sm:justify-between">
          <Card className="flex flex-1 items-center gap-4">
            <div className="flex h-11 w-11 items-center
                            justify-center rounded-2xl
                            bg-amber-100 text-amber-700">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold
                            text-ink-900">
                {loading ? "—" : formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-ink-500">Total pending</p>
            </div>
          </Card>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create bill
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No bills yet"
            description="Create a bill after a completed visit."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto_auto]
                            gap-4 border-b border-ink-100 px-5 py-3
                            text-xs font-semibold uppercase tracking-wide
                            text-ink-500 sm:grid">
              <span>Patient</span>
              <span>Doctor</span>
              <span className="text-right">Total</span>
              <span className="text-right">Status</span>
              <span className="text-right">View</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-ink-100">
              {bills.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-2 gap-2 px-5 py-4
                             sm:grid-cols-[1fr_1fr_auto_auto_auto_auto]
                             sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      {b.patientName}
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatDate(b.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm text-ink-500">
                    {b.doctorName}
                  </span>
                  <span className="text-right font-display
                                   text-sm font-semibold text-ink-900">
                    {formatCurrency(b.totalAmount)}
                  </span>
                  <span className="flex justify-start sm:justify-end">
                    <Badge status={b.status}>{b.status}</Badge>
                  </span>

                  {/* ✅ View detail button */}
                  <span className="flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewDetail(b.id)}
                      loading={loadingDetail}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </span>

                  <span className="flex justify-end">
                    {b.status === "PENDING" ? (
                      <Button
                        size="sm"
                        onClick={() => setPayTarget(b)}
                      >
                        Mark paid
                      </Button>
                    ) : (
                      <span className="text-xs text-ink-500">
                        {b.paymentMethod || "—"}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── Pay modal ─────────────────────────────────────── */}
      <Modal
        open={payTarget !== null}
        onClose={() => setPayTarget(null)}
        title="Mark bill as paid"
      >
        {payTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink-500">
              Confirm payment of{" "}
              <span className="font-semibold text-ink-900">
                {formatCurrency(payTarget.totalAmount)}
              </span>{" "}
              from {payTarget.patientName}.
            </p>
            <Select
              label="Payment method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Button
              className="w-full"
              onClick={handlePay}
              loading={paying}
            >
              Confirm payment
            </Button>
          </div>
        )}
      </Modal>

      {/* ✅ Bill detail modal ─────────────────────────────── */}
      <Modal
        open={detailBill !== null}
        onClose={() => setDetailBill(null)}
        title="Bill Details"
      >
        {detailBill && (
          <div className="space-y-4">
            {/* Patient & Doctor */}
            <div className="rounded-xl bg-ink-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Patient</span>
                <span className="font-medium text-ink-900">
                  {detailBill.patientName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Doctor</span>
                <span className="font-medium text-ink-900">
                  {detailBill.doctorName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Department</span>
                <span className="font-medium text-ink-900">
                  {detailBill.departmentName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Date</span>
                <span className="font-medium text-ink-900">
                  {formatDate(detailBill.createdAt)}
                </span>
              </div>
            </div>

            {/* Amount breakdown */}
            <div className="rounded-xl border border-ink-100
                            p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">
                  Consultation fee
                </span>
                <span className="text-ink-900">
                  {formatCurrency(detailBill.consultationFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">
                  Additional charges
                </span>
                <span className="text-ink-900">
                  {formatCurrency(detailBill.additionalCharges)}
                </span>
              </div>
              <hr className="border-ink-100" />
              <div className="flex justify-between text-sm
                              font-semibold">
                <span className="text-ink-900">Total</span>
                <span className="text-ink-900">
                  {formatCurrency(detailBill.totalAmount)}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-500">Status</span>
              <Badge status={detailBill.status}>
                {detailBill.status}
              </Badge>
            </div>

            {detailBill.paymentMethod && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-500">
                  Payment method
                </span>
                <span className="text-sm font-medium text-ink-900">
                  {detailBill.paymentMethod}
                </span>
              </div>
            )}

            {detailBill.notes && (
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-xs text-ink-500 mb-1">Notes</p>
                <p className="text-sm text-ink-700">
                  {detailBill.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Create bill modal ─────────────────────────────── */}
      <CreateBillModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          showToast("Bill created.", "success");
          load();
        }}
      />
    </>
  );
}

// ─── Create Bill Modal (unchanged) ───────────────────────
function CreateBillModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<
    "patient" | "appointment" | "details"
  >("patient");
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] =
    useState<PatientResponse | null>(null);
  const [appointments, setAppointments] = useState<
    AppointmentResponse[]
  >([]);
  const [loadingAppointments, setLoadingAppointments] =
    useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentResponse | null>(null);
  const [additionalCharges, setAdditionalCharges] = useState("0");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("patient");
      setQuery("");
      setPatients([]);
      setSelectedPatient(null);
      setAppointments([]);
      setSelectedAppointment(null);
      setAdditionalCharges("0");
      setNotes("");
      setError("");
    }
  }, [open]);

  async function handlePatientSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await searchPatients({ name: query, size: 10 });
      setPatients(data.content);
    } finally {
      setSearching(false);
    }
  }

  async function selectPatient(p: PatientResponse) {
    setSelectedPatient(p);
    setStep("appointment");
    setLoadingAppointments(true);
    try {
      const data = await searchAllAppointments({
        patientId: p.id,
        status: "COMPLETED",
        size: 20,
      });
      setAppointments(data.content);
    } catch {
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }

  function selectAppointment(a: AppointmentResponse) {
    setSelectedAppointment(a);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppointment) return;
    setError("");
    setCreating(true);
    try {
      await createBill({
        appointmentId: selectedAppointment.id,
        additionalCharges: Number(additionalCharges) || 0,
        notes,
      });
      onCreated();
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Couldn't create this bill — it may already have one."
        )
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create bill">
      <div className="space-y-4">
        {step === "patient" && (
          <>
            <form
              onSubmit={handlePatientSearch}
              className="flex gap-2"
            >
              <Input
                placeholder="Search patient by name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" loading={searching}>
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <div className="space-y-2">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  className="flex w-full items-center gap-3
                             rounded-xl border border-ink-100
                             p-2.5 text-left
                             hover:border-brand-300
                             hover:bg-brand-50"
                >
                  <div className="flex h-9 w-9 items-center
                                  justify-center rounded-full
                                  bg-brand-700 text-xs
                                  font-semibold text-white">
                    {initials(p.patientName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      {p.patientName}
                    </p>
                    <p className="text-xs text-ink-500">{p.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "appointment" && selectedPatient && (
          <>
            <button
              onClick={() => setStep("patient")}
              className="flex items-center gap-1 text-xs
                         font-medium text-ink-500
                         hover:text-ink-900"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to patient search
            </button>
            <p className="text-sm text-ink-700">
              Completed visits for{" "}
              <span className="font-semibold">
                {selectedPatient.patientName}
              </span>
            </p>
            {loadingAppointments ? (
              <Skeleton className="h-16 w-full" />
            ) : appointments.length === 0 ? (
              <Alert tone="info">
                No completed appointments found for this patient.
              </Alert>
            ) : (
              <div className="space-y-2">
                {appointments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => selectAppointment(a)}
                    className="flex w-full items-center
                               justify-between rounded-xl
                               border border-ink-100 p-2.5
                               text-left hover:border-brand-300
                               hover:bg-brand-50"
                  >
                    <div>
                      <p className="text-sm font-medium
                                    text-ink-900">
                        {a.doctorName}
                      </p>
                      <p className="text-xs text-ink-500">
                        {formatDate(a.appointmentDate)} ·{" "}
                        {a.departmentName}
                      </p>
                    </div>
                    <Badge status={a.status}>{a.status}</Badge>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === "details" &&
          selectedAppointment &&
          selectedPatient && (
            <>
              <button
                onClick={() => setStep("appointment")}
                className="flex items-center gap-1 text-xs
                           font-medium text-ink-500
                           hover:text-ink-900"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Choose a different visit
              </button>
              <div className="flex items-center justify-between
                              rounded-xl bg-brand-50 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {selectedPatient.patientName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {selectedAppointment.doctorName} ·{" "}
                    {formatDate(selectedAppointment.appointmentDate)}
                  </p>
                </div>
                <button onClick={() => setStep("appointment")}>
                  <X className="h-4 w-4 text-ink-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="number"
                  label="Additional charges (₹)"
                  value={additionalCharges}
                  onChange={(e) =>
                    setAdditionalCharges(e.target.value)
                  }
                />
                <Input
                  label="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {error && <Alert tone="error">{error}</Alert>}
                <Button
                  type="submit"
                  className="w-full"
                  loading={creating}
                >
                  Create bill
                </Button>
              </form>
            </>
          )}
      </div>
    </Modal>
  );
}
