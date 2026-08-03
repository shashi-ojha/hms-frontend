"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  UserCheck,
  UserX,
  ArrowLeft,
  User,
  Mail,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  getPendingPatients,
  approvePatient,
  rejectPatient,
  apiErrorMessage,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────
interface PendingUser {
  userId: number;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
}

const bloodGroups = [
  "A_POSITIVE", "A_NEGATIVE",
  "B_POSITIVE", "B_NEGATIVE",
  "AB_POSITIVE", "AB_NEGATIVE",
  "O_POSITIVE", "O_NEGATIVE",
];

const emptyProfile = {
  dateOfBirth: "",
  bloodGroup: "",
  address: "",
  emergencyContactName: "",
  emergencyContact: "",
  medicalHistory: "",
};

// ──────────────────────────────────────────────────────────
export default function ApprovePatientPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.userId);

  const [user, setUser] = useState<PendingUser | null>(null);
  const [profile, setProfile] = useState(emptyProfile);

  const [loadingUser, setLoadingUser] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState<
    "approved" | "rejected" | null
  >(null);

  const today = new Date().toISOString().split("T")[0];

  function update(
    key: keyof typeof emptyProfile,
    value: string
  ) {
    setProfile((f) => ({ ...f, [key]: value }));
  }

  // ─── Load user from pending list ──────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingUser(true);
      try {
        const list: PendingUser[] = await getPendingPatients();
        const found = list.find((p) => p.userId === userId);
        if (!found) {
          setError("Patient not found or already processed.");
        } else {
          setUser(found);
        }
      } catch (err) {
        setError(
          apiErrorMessage(err, "Failed to load patient details.")
        );
      } finally {
        setLoadingUser(false);
      }
    }
    load();
  }, [userId]);

  // ─── Approve ──────────────────────────────────────────────
  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setApproving(true);
    try {
      await approvePatient(userId, profile);
      setSuccess("approved");
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Failed to approve patient. Please try again."
        )
      );
    } finally {
      setApproving(false);
    }
  }

  // ─── Reject ───────────────────────────────────────────────
  async function handleReject() {
    setError("");
    setRejecting(true);
    try {
      await rejectPatient(userId);
      setSuccess("rejected");
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Failed to reject patient. Please try again."
        )
      );
    } finally {
      setRejecting(false);
      setShowRejectConfirm(false);
    }
  }

  // ──────────────────────────────────────────────────────────
  // SUCCESS STATE
  if (success) {
    return (
      <>
        <Topbar
          title="Pending Approvals"
          subtitle="Review and approve self-registered patients"
          profileHref="/reception/dashboard"
        />
        <div className="mx-auto max-w-2xl px-6 pb-10
                        lg:px-10 pt-6">
          <Card>
            <div className="flex flex-col items-center
                            gap-4 py-12 text-center">
              {success === "approved" ? (
                <>
                  <div className="flex h-14 w-14 items-center
                                  justify-center rounded-2xl
                                  bg-green-100">
                    <UserCheck className="h-8 w-8
                                         text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold
                                 text-ink-900">
                    Patient Approved!
                  </h2>
                  <p className="text-sm text-ink-500 max-w-sm">
                    <strong>{user?.name}</strong>'s account is
                    now active. They can log in and access all
                    portal features.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center
                                  justify-center rounded-2xl
                                  bg-red-100">
                    <UserX className="h-8 w-8 text-red-600" />
                  </div>
                  <h2 className="text-lg font-semibold
                                 text-ink-900">
                    Patient Rejected
                  </h2>
                  <p className="text-sm text-ink-500 max-w-sm">
                    <strong>{user?.name}</strong>'s registration
                    has been rejected and their account
                    deactivated.
                  </p>
                </>
              )}

              <div className="flex gap-3 mt-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(
                      "/reception/pending-approvals"
                    )
                  }
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to list
                </Button>
                <Button
                  onClick={() =>
                    router.push("/reception/dashboard")
                  }
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </>
    );
  }

  // ──────────────────────────────────────────────────────────
  return (
    <>
      <Topbar
        title="Review Patient"
        subtitle="Complete profile and approve registration"
        profileHref="/reception/dashboard"
      />

      <div className="mx-auto max-w-2xl space-y-6
                      px-6 pb-10 lg:px-10">

        {/* ── Back button ─────────────────────────────────── */}
        <button
          onClick={() =>
            router.push("/reception/pending-approvals")
          }
          className="flex items-center gap-1.5 text-sm
                     text-ink-500 hover:text-ink-900
                     transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to pending list
        </button>

        {/* ── Loading ─────────────────────────────────────── */}
        {loadingUser && (
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-ink-100
                            animate-pulse" />
            <div className="h-64 rounded-2xl bg-ink-100
                            animate-pulse" />
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {!loadingUser && error && !user && (
          <Alert tone="error">{error}</Alert>
        )}

        {/* ── Main content ────────────────────────────────── */}
        {!loadingUser && user && (
          <>
            {/* User info card (read-only) */}
            <Card>
              <p className="text-xs font-semibold uppercase
                            tracking-wide text-ink-500 mb-4">
                Self-Registered Account
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0
                                  items-center justify-center
                                  rounded-xl bg-brand-100">
                    <User className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">
                      Full name
                    </p>
                    <p className="text-sm font-medium
                                  text-ink-900">
                      {user.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0
                                  items-center justify-center
                                  rounded-xl bg-brand-100">
                    <Mail className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">
                      Email
                    </p>
                    <p className="text-sm font-medium
                                  text-ink-900">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0
                                  items-center justify-center
                                  rounded-xl bg-brand-100">
                    <Phone className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">
                      Phone
                    </p>
                    <p className="text-sm font-medium
                                  text-ink-900">
                      {user.phone}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Medical profile form */}
            <Card>
              <form
                onSubmit={handleApprove}
                className="space-y-4"
              >
                <p className="text-xs font-semibold uppercase
                              tracking-wide text-ink-500">
                  Complete Medical Profile
                </p>

                <div className="grid grid-cols-1 gap-4
                                sm:grid-cols-2">
                  <Input
                    type="date"
                    label="Date of birth"
                    max={today}
                    value={profile.dateOfBirth}
                    onChange={(e) =>
                      update("dateOfBirth", e.target.value)
                    }
                    required
                  />
                  <Select
                    label="Blood group"
                    value={profile.bloodGroup}
                    onChange={(e) =>
                      update("bloodGroup", e.target.value)
                    }
                    required
                  >
                    <option value="">Select blood group</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg.replace("_", " ")}
                      </option>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Address"
                  value={profile.address}
                  onChange={(e) =>
                    update("address", e.target.value)
                  }
                  required
                />

                <div className="grid grid-cols-1 gap-4
                                sm:grid-cols-2">
                  <Input
                    label="Emergency contact name"
                    value={profile.emergencyContactName}
                    onChange={(e) =>
                      update(
                        "emergencyContactName",
                        e.target.value
                      )
                    }
                    required
                  />
                  <Input
                    type="tel"
                    label="Emergency contact number"
                    value={profile.emergencyContact}
                    onChange={(e) =>
                      update("emergencyContact", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium
                                    text-ink-700">
                    Medical history{" "}
                    <span className="text-ink-400">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={profile.medicalHistory}
                    onChange={(e) =>
                      update("medicalHistory", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-xl border
                               border-ink-100 bg-white px-3.5
                               py-2.5 text-sm text-ink-900
                               focus:outline-none focus:ring-2
                               focus:ring-brand-500"
                  />
                </div>

                {error && (
                  <Alert tone="error">{error}</Alert>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  {/* Reject button */}
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 border-red-200
                               text-red-600 hover:bg-red-50"
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={approving}
                  >
                    <UserX className="h-4 w-4" />
                    Reject
                  </Button>

                  {/* Approve button */}
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={approving}
                  >
                    <UserCheck className="h-4 w-4" />
                    Approve & Activate
                  </Button>
                </div>
              </form>
            </Card>
          </>
        )}

        {/* ── Reject confirmation modal ────────────────────── */}
        {showRejectConfirm && (
          <div className="fixed inset-0 z-50 flex items-center
                          justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl
                            bg-white p-6 shadow-xl space-y-4">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0
                                items-center justify-center
                                rounded-xl bg-red-100">
                  <AlertTriangle className="h-6 w-6
                                           text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900">
                    Reject Registration?
                  </p>
                  <p className="text-sm text-ink-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-sm text-ink-600">
                Are you sure you want to reject{" "}
                <strong>{user?.name}</strong>'s registration?
                Their account will be deactivated and they
                will be notified.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowRejectConfirm(false)}
                  disabled={rejecting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600
                             hover:bg-red-700"
                  loading={rejecting}
                  onClick={handleReject}
                >
                  <UserX className="h-4 w-4" />
                  Yes, Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
