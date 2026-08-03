"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Pill,
  Search,
  X,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAllRecords, getPrescriptionsByRecord } from "@/lib/api";
import { formatDate } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────
interface MedicalRecord {
  id: number;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  createdAt: string;
}

interface Prescription {
  id: number;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export default function AdminRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filtered, setFiltered] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Search ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── Expand ───────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState<number | null>(
    null
  );
  const [prescriptions, setPrescriptions] = useState<
    Record<number, Prescription[]>
  >({});
  const [loadingRx, setLoadingRx] = useState<number | null>(
    null
  );

  // ── Load all records ─────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getAllRecords();
        setRecords(data);
        setFiltered(data);
      } catch {
        setRecords([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Search filter ────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFiltered(
      records.filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.doctorName.toLowerCase().includes(q) ||
          r.diagnosis.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, records]);

  // ── Toggle expand — load prescriptions ───────────────────
  async function toggleExpand(record: MedicalRecord) {
    if (expandedId === record.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(record.id);

    // Already loaded
    if (prescriptions[record.id]) return;

    setLoadingRx(record.id);
    try {
      const rx = await getPrescriptionsByRecord(record.id);
      setPrescriptions((prev) => ({
        ...prev,
        [record.id]: rx,
      }));
    } catch {
      setPrescriptions((prev) => ({
        ...prev,
        [record.id]: [],
      }));
    } finally {
      setLoadingRx(null);
    }
  }

  return (
    <>
      <Topbar
        title="Medical Records"
        subtitle="All patient diagnoses and treatments"
        profileHref="/admin/dashboard"
      />

      <div className="space-y-6 px-6 pb-10 lg:px-10">

        {/* ── Stats bar ───────────────────────────────────── */}
        {!loading && (
          <div className="flex items-center justify-between
                          rounded-2xl border border-ink-100
                          bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center
                              justify-center rounded-xl
                              bg-brand-100">
                <ClipboardList className="h-5 w-5
                                         text-brand-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {records.length} total records
                </p>
                <p className="text-xs text-ink-500">
                  Across all patients and doctors
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Search ──────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2
                             -translate-y-1/2 h-4 w-4
                             text-ink-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by patient, doctor or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-ink-100
                       bg-white pl-10 pr-10 py-2.5 text-sm
                       text-ink-900 focus:outline-none
                       focus:ring-2 focus:ring-brand-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2
                         -translate-y-1/2"
            >
              <X className="h-4 w-4 text-ink-400
                            hover:text-ink-900" />
            </button>
          )}
        </div>

        {/* ── Loading ─────────────────────────────────────── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────── */}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title={
              searchQuery
                ? "No records match your search"
                : "No medical records yet"
            }
            description={
              searchQuery
                ? "Try a different patient name, doctor or diagnosis."
                : "Records will appear here after doctors complete appointments."
            }
          />
        )}

        {/* ── Records list ────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((record) => {
              const isExpanded = expandedId === record.id;
              const rxList = prescriptions[record.id] || [];

              return (
                <Card
                  key={record.id}
                  className="p-0 overflow-hidden"
                >
                  {/* ── Header row ────────────────────────── */}
                  <button
                    onClick={() => toggleExpand(record)}
                    className="flex w-full items-center gap-4
                               px-5 py-4 text-left
                               hover:bg-ink-50 transition-colors"
                  >
                    {/* Patient & Doctor */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold
                                    text-ink-900 truncate">
                        {record.patientName}
                      </p>
                      <p className="text-xs text-ink-500 truncate">
                        Dr. {record.doctorName} ·{" "}
                        {formatDate(record.createdAt)}
                      </p>
                    </div>

                    {/* Diagnosis preview */}
                    <p className="hidden sm:block text-xs
                                  text-ink-500 max-w-[200px]
                                  truncate">
                      {record.diagnosis}
                    </p>

                    {/* Expand icon */}
                    {loadingRx === record.id ? (
                      <div className="h-4 w-4 animate-spin
                                      rounded-full border-2
                                      border-brand-500
                                      border-t-transparent
                                      shrink-0" />
                    ) : isExpanded ? (
                      <ChevronUp className="h-4 w-4
                                           text-ink-400
                                           shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4
                                             text-ink-400
                                             shrink-0" />
                    )}
                  </button>

                  {/* ── Expanded detail ───────────────────── */}
                  {isExpanded && (
                    <div className="border-t border-ink-100
                                    px-5 py-4 space-y-4">

                      {/* Record details */}
                      <div className="grid grid-cols-1 gap-4
                                      sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-ink-500
                                        mb-1">
                            Diagnosis
                          </p>
                          <p className="text-sm font-medium
                                        text-ink-900">
                            {record.diagnosis}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-500
                                        mb-1">
                            Treatment
                          </p>
                          <p className="text-sm font-medium
                                        text-ink-900">
                            {record.treatment}
                          </p>
                        </div>
                        {record.notes && (
                          <div>
                            <p className="text-xs text-ink-500
                                          mb-1">
                              Notes
                            </p>
                            <p className="text-sm text-ink-700">
                              {record.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Prescriptions */}
                      <div>
                        <p className="text-xs font-semibold
                                      uppercase tracking-wide
                                      text-ink-500 mb-2
                                      flex items-center gap-1.5">
                          <Pill className="h-3.5 w-3.5" />
                          Prescriptions ({rxList.length})
                        </p>

                        {rxList.length === 0 ? (
                          <p className="text-xs text-ink-400
                                        italic">
                            No prescriptions for this record.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1
                                          gap-2 sm:grid-cols-2
                                          lg:grid-cols-3">
                            {rxList.map((rx) => (
                              <div
                                key={rx.id}
                                className="rounded-xl
                                           bg-ink-50 px-3.5
                                           py-3"
                              >
                                <p className="text-sm
                                              font-semibold
                                              text-ink-900">
                                  {rx.medicineName}
                                </p>
                                <p className="text-xs
                                              text-ink-500
                                              mt-0.5">
                                  {rx.dosage} · {rx.duration}
                                </p>
                                {rx.instructions && (
                                  <p className="text-xs
                                                text-ink-400
                                                mt-0.5">
                                    {rx.instructions}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
