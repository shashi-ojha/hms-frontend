"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  ChevronRight,
  Users,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getPendingPatients, apiErrorMessage } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────
interface PendingUser {
  userId: number;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
}

// ─── Helpers ──────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}hr ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ──────────────────────────────────────────────────────────
export default function PendingApprovalsPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<PendingUser[]>([]);
  const [filtered, setFiltered] = useState<PendingUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ─── Load pending patients ───────────────────────────────
  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getPendingPatients();
      setPatients(data);
      setFiltered(data);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Failed to load pending patients.")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ─── Local search filter ─────────────────────────────────
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFiltered(
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.includes(q)
      )
    );
  }, [searchQuery, patients]);

  // ──────────────────────────────────────────────────────────
  return (
    <>
      <Topbar
        title="Pending Approvals"
        subtitle="Review and approve self-registered patients"
        profileHref="/reception/dashboard"
      />

      <div className="mx-auto max-w-3xl space-y-6 px-6 pb-10 lg:px-10">

        {/* ── Stats bar ───────────────────────────────────── */}
        <div className="flex items-center justify-between
                        rounded-2xl bg-amber-50 border
                        border-amber-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center
                            justify-center rounded-xl
                            bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {patients.length} patient
                {patients.length !== 1 ? "s" : ""} waiting
              </p>
              <p className="text-xs text-amber-600">
                Requires your review and approval
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={load}
            loading={loading}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* ── Error ───────────────────────────────────────── */}
        {error && <Alert tone="error">{error}</Alert>}

        {/* ── Search ──────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2
                             -translate-y-1/2 h-4 w-4
                             text-ink-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-ink-100
                       bg-white pl-10 pr-4 py-2.5 text-sm
                       text-ink-900 focus:outline-none
                       focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* ── Loading ─────────────────────────────────────── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-ink-100
                           animate-pulse"
              />
            ))}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────── */}
        {!loading && filtered.length === 0 && (
          <Card>
            <div className="flex flex-col items-center
                            gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center
                              justify-center rounded-2xl
                              bg-green-50">
                <UserCheck className="h-7 w-7 text-green-500" />
              </div>
              <p className="font-semibold text-ink-900">
                {searchQuery
                  ? "No results found"
                  : "All caught up!"}
              </p>
              <p className="text-sm text-ink-500">
                {searchQuery
                  ? "Try a different search term."
                  : "No patients are waiting for approval."}
              </p>
            </div>
          </Card>
        )}

        {/* ── Patient list ────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((patient) => (
              <button
                key={patient.userId}
                onClick={() =>
                  router.push(
                    `/reception/pending-approvals/${patient.userId}`
                  )
                }
                className="w-full text-left rounded-2xl
                           border border-ink-100 bg-white
                           p-4 shadow-sm hover:border-brand-300
                           hover:shadow-md transition-all
                           duration-150 group"
              >
                <div className="flex items-center gap-4">

                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0
                                  items-center justify-center
                                  rounded-xl bg-amber-100
                                  text-amber-700 font-semibold
                                  text-sm">
                    {getInitials(patient.name)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-900
                                  truncate">
                      {patient.name}
                    </p>
                    <p className="text-xs text-ink-500 truncate">
                      {patient.email} • {patient.phone}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center
                                       gap-1 rounded-full bg-amber-100
                                       px-2 py-0.5 text-xs font-medium
                                       text-amber-700">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                      <span className="text-xs text-ink-400">
                        Registered{" "}
                        {patient.registeredAt
                          ? timeAgo(patient.registeredAt)
                          : "recently"}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    className="h-5 w-5 text-ink-300
                               group-hover:text-brand-500
                               transition-colors shrink-0"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
