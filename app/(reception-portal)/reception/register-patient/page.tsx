"use client";

import { useState } from "react";
import {
  UserPlus,
  CheckCircle2,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  register,
  createPatientRecord,
  searchUserByEmailOrPhone,
  apiErrorMessage,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────
type Step =
  | "search"          // Step 1 — search existing user
  | "found"           // Step 2a — user found, complete profile
  | "not-found"       // Step 2b — user not found, create new
  | "success";        // Step 3 — done

interface FoundUser {
  userId: number;
  name: string;
  email: string;
  phone: string;
}

const bloodGroups = [
  "A_POSITIVE", "A_NEGATIVE",
  "B_POSITIVE", "B_NEGATIVE",
  "AB_POSITIVE", "AB_NEGATIVE",
  "O_POSITIVE", "O_NEGATIVE",
];

// ─── Initial form states ───────────────────────────────────
const emptyNewUser = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const emptyProfile = {
  dateOfBirth: "",
  bloodGroup: "",
  address: "",
  emergencyContactName: "",
  emergencyContact: "",
  medicalHistory: "",
};

// ──────────────────────────────────────────────────────────
export default function RegisterPatientPage() {
  // Step state
  const [step, setStep] = useState<Step>("search");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Found user
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);

  // New user form (Scenario 2)
  const [newUser, setNewUser] = useState(emptyNewUser);

  // Medical profile form (both scenarios)
  const [profile, setProfile] = useState(emptyProfile);

  // Submission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ─── Helpers ──────────────────────────────────────────────
  function updateNewUser(key: keyof typeof newUser, value: string) {
    setNewUser((f) => ({ ...f, [key]: value }));
  }

  function updateProfile(key: keyof typeof profile, value: string) {
    setProfile((f) => ({ ...f, [key]: value }));
  }

  function resetAll() {
    setStep("search");
    setSearchQuery("");
    setSearchError("");
    setFoundUser(null);
    setNewUser(emptyNewUser);
    setProfile(emptyProfile);
    setError("");
  }

  // ─── Step 1: Search existing user ─────────────────────────
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchError("");
    setSearching(true);
    try {
      const user = await searchUserByEmailOrPhone(searchQuery.trim());
      if (user) {
        setFoundUser(user);
        setStep("found");
      } else {
        setStep("not-found");
      }
    } catch {
      setStep("not-found");
    } finally {
      setSearching(false);
    }
  }

  // ─── Step 2a: Submit for found user ───────────────────────
  async function handleFoundUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createPatientRecord({
        userId: foundUser!.userId,
        ...profile,
      });
      setStep("success");
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Couldn't complete patient registration. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 2b: Submit for new user ─────────────────────────
  async function handleNewUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Create User account
      const auth = await register({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
        role: "PATIENT",
      });

      // 2. Create Patient record with returned userId
      await createPatientRecord({
        userId: auth.userId,
        ...profile,
      });

      setStep("success");
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Couldn't register this patient. Check the details and try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  // ──────────────────────────────────────────────────────────
  return (
    <>
      <Topbar
        title="Register Patient"
        subtitle="Set up a walk-in patient's account"
        profileHref="/reception/dashboard"
      />

      <div className="mx-auto max-w-2xl space-y-6 px-6 pb-10 lg:px-10">

        {/* ── SUCCESS ───────────────────────────────────────── */}
        {step === "success" && (
          <Card>
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h2 className="text-lg font-semibold text-ink-900">
                Patient Registered Successfully
              </h2>
              <p className="text-sm text-ink-500">
                The patient profile has been created and is ready to use.
              </p>
              <Button onClick={resetAll} variant="secondary">
                Register Another Patient
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 1: SEARCH ────────────────────────────────── */}
        {step === "search" && (
          <Card>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-ink-400" />
                <p className="text-sm font-semibold text-ink-700">
                  Search Existing Patient
                </p>
              </div>

              <p className="text-xs text-ink-500">
                Enter the patient's email or phone number to check if they
                already have an account before creating a new one.
              </p>

              <Input
                label="Email or Phone number"
                placeholder="e.g. john@email.com or 9876543210"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />

              {searchError && (
                <Alert tone="error">{searchError}</Alert>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  loading={searching}
                >
                  <Search className="h-4 w-4" />
                  Search
                </Button>

                {/* Skip search — go directly to new patient form */}
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setStep("not-found")}
                >
                  <UserPlus className="h-4 w-4" />
                  New Patient
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── STEP 2a: USER FOUND ───────────────────────────── */}
        {step === "found" && foundUser && (
          <>
            {/* Found user banner */}
            <Alert tone="success">
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4" />
                Existing account found for{" "}
                <strong>{foundUser.name}</strong> ({foundUser.email})
                — complete the medical profile below.
              </span>
            </Alert>

            <Card>
              {/* Read-only user details */}
              <div className="mb-4 rounded-xl bg-ink-50 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Account Details (read-only)
                </p>
                <p className="text-sm text-ink-700">
                  <span className="font-medium">Name:</span> {foundUser.name}
                </p>
                <p className="text-sm text-ink-700">
                  <span className="font-medium">Email:</span> {foundUser.email}
                </p>
                <p className="text-sm text-ink-700">
                  <span className="font-medium">Phone:</span> {foundUser.phone}
                </p>
              </div>

              <form onSubmit={handleFoundUserSubmit} className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Complete Medical Profile
                </p>

                {/* Shared profile fields */}
                <ProfileFields
                  profile={profile}
                  update={updateProfile}
                  today={today}
                />

                {error && <Alert tone="error">{error}</Alert>}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={resetAll}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={loading}
                  >
                    <UserCheck className="h-4 w-4" />
                    Complete Registration
                  </Button>
                </div>
              </form>
            </Card>
          </>
        )}

        {/* ── STEP 2b: USER NOT FOUND ───────────────────────── */}
        {step === "not-found" && (
          <>
            <Alert tone="info">
              <span className="flex items-center gap-1.5">
                <UserX className="h-4 w-4" />
                No existing account found. Fill in all details to create
                a new patient account.
              </span>
            </Alert>

            <Card>
              <form onSubmit={handleNewUserSubmit} className="space-y-4">

                {/* Login details */}
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Login Details
                </p>
                <Input
                  label="Full name"
                  value={newUser.name}
                  onChange={(e) => updateNewUser("name", e.target.value)}
                  required
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    type="email"
                    label="Email"
                    value={newUser.email}
                    onChange={(e) => updateNewUser("email", e.target.value)}
                    required
                  />
                  <Input
                    type="tel"
                    label="Phone"
                    value={newUser.phone}
                    onChange={(e) => updateNewUser("phone", e.target.value)}
                    required
                  />
                </div>
                <Input
                  type="password"
                  label="Temporary password"
                  placeholder="At least 6 characters"
                  value={newUser.password}
                  onChange={(e) => updateNewUser("password", e.target.value)}
                  required
                  minLength={6}
                />

                <hr className="border-ink-100" />

                {/* Medical profile */}
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Medical Profile
                </p>
                <ProfileFields
                  profile={profile}
                  update={updateProfile}
                  today={today}
                />

                {error && <Alert tone="error">{error}</Alert>}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={resetAll}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={loading}
                  >
                    <UserPlus className="h-4 w-4" />
                    Register Patient
                  </Button>
                </div>
              </form>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

// ─── Shared Medical Profile Fields Component ──────────────
function ProfileFields({
  profile,
  update,
  today,
}: {
  profile: typeof emptyProfile;
  update: (key: keyof typeof emptyProfile, value: string) => void;
  today: string;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="date"
          label="Date of birth"
          max={today}
          value={profile.dateOfBirth}
          onChange={(e) => update("dateOfBirth", e.target.value)}
          required
        />
        <Select
          label="Blood group"
          value={profile.bloodGroup}
          onChange={(e) => update("bloodGroup", e.target.value)}
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
        onChange={(e) => update("address", e.target.value)}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Emergency contact name"
          value={profile.emergencyContactName}
          onChange={(e) => update("emergencyContactName", e.target.value)}
          required
        />
        <Input
          type="tel"
          label="Emergency contact number"
          value={profile.emergencyContact}
          onChange={(e) => update("emergencyContact", e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-700">
          Medical history{" "}
          <span className="text-ink-400">(optional)</span>
        </label>
        <textarea
          value={profile.medicalHistory}
          onChange={(e) => update("medicalHistory", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
    </>
  );
}
