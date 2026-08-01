"use client";

import { useEffect, useState } from "react";
import { Receipt, Wallet, AlertCircle } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PayNowButton } from "@/components/PayNowButton";
import { useAuth } from "@/lib/auth-context";
import { getPatientBills } from "@/lib/api";
import { BillResponse } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

export default function BillsPage() {
  const { patient } = useAuth();
  const [bills, setBills] = useState<BillResponse[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!patient) return;
    const data = await getPatientBills(patient.id);
    setBills(
      [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  const totalPaid = bills
    .filter((b) => b.status === "PAID")
    .reduce((s, b) => s + b.totalAmount, 0);
  const totalPending = bills
    .filter((b) => b.status === "PENDING")
    .reduce((s, b) => s + b.totalAmount, 0);

  return (
    <>
      <Topbar title="Bills" subtitle="Charges from your appointments" />

      <div className="space-y-6 px-6 pb-10 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-ink-900">
                {loading ? "—" : formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-ink-500">Total paid</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-ink-900">
                {loading ? "—" : formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-ink-500">Pending — pay online below</p>
            </div>
          </Card>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No bills yet"
            description="Bills are generated automatically after a completed visit."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="hidden grid-cols-[1fr_1fr_auto_auto_auto] gap-4 border-b border-ink-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 sm:grid">
              <span>Doctor</span>
              <span>Date</span>
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
                    <p className="text-sm font-medium text-ink-900">
                      {b.doctorName}
                    </p>
                    <p className="text-xs text-ink-500">{b.departmentName}</p>
                  </div>
                  <span className="text-sm text-ink-500">
                    {formatDate(b.createdAt)}
                  </span>
                  <span className="text-right font-display text-sm font-semibold text-ink-900">
                    {formatCurrency(b.totalAmount)}
                  </span>
                  <span className="flex justify-start sm:justify-end">
                    <Badge status={b.status}>{b.status}</Badge>
                  </span>
                  <span className="flex justify-end">
                    {b.status === "PENDING" ? (
                      <PayNowButton bill={b} onPaid={load} />
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
    </>
  );
}