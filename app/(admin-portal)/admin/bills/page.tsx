"use client";

import { useEffect, useState } from "react";
import { Receipt, IndianRupee } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/lib/toast-context";
import { getAllBills, payBill } from "@/lib/api";
import { BillResponse } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

const paymentMethods = ["CASH", "CARD", "UPI", "NET_BANKING"];

export default function AdminBillsPage() {
  const { showToast } = useToast();
  const [bills, setBills] = useState<BillResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [payTarget, setPayTarget] = useState<BillResponse | null>(null);
  const [method, setMethod] = useState("CASH");
  const [paying, setPaying] = useState(false);

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

  async function handlePay() {
    if (!payTarget) return;
    setPaying(true);
    try {
      await payBill(payTarget.id, method);
      showToast("Bill marked as paid.", "success");
      setPayTarget(null);
      await load();
    } catch {
      showToast("Couldn't update this bill. Try again.", "error");
    } finally {
      setPaying(false);
    }
  }

  const totalPending = bills
    .filter((b) => b.status === "PENDING")
    .reduce((s, b) => s + b.totalAmount, 0);

  return (
    <>
      <Topbar title="Bills" subtitle="All patient billing" profileHref="/admin/dashboard" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <Card className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-ink-900">
              {loading ? "—" : formatCurrency(totalPending)}
            </p>
            <p className="text-xs text-ink-500">Total pending across all patients</p>
          </div>
        </Card>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : bills.length === 0 ? (
          <EmptyState icon={Receipt} title="No bills yet" description="Bills will appear here as visits are completed." />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto] gap-4 border-b border-ink-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 sm:grid">
              <span>Patient</span>
              <span>Doctor</span>
              <span className="text-right">Total</span>
              <span className="text-right">Status</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-ink-100">
              {bills.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-2 gap-2 px-5 py-4 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900">{b.patientName}</p>
                    <p className="text-xs text-ink-500">{formatDate(b.createdAt)}</p>
                  </div>
                  <span className="text-sm text-ink-500">{b.doctorName}</span>
                  <span className="text-right font-display text-sm font-semibold text-ink-900">
                    {formatCurrency(b.totalAmount)}
                  </span>
                  <span className="flex justify-start sm:justify-end">
                    <Badge status={b.status}>{b.status}</Badge>
                  </span>
                  <span className="flex justify-end">
                    {b.status === "PENDING" ? (
                      <Button size="sm" onClick={() => setPayTarget(b)}>
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

      <Modal open={payTarget !== null} onClose={() => setPayTarget(null)} title="Mark bill as paid">
        {payTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink-500">
              Confirm payment of{" "}
              <span className="font-semibold text-ink-900">
                {formatCurrency(payTarget.totalAmount)}
              </span>{" "}
              from {payTarget.patientName}.
            </p>
            <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Button className="w-full" onClick={handlePay} loading={paying}>
              Confirm payment
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}