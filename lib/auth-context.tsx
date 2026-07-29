"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AuthResponse, PatientResponse, DoctorResponse } from "./types";
import { getPatientByUserId, getDoctorByUserId } from "./api";

interface AuthContextValue {
  user: AuthResponse | null;
  // --- Patient ---
  patient: PatientResponse | null;
  patientLoading: boolean;
  patientMissing: boolean;
  refreshPatient: () => Promise<void>;
  // --- Doctor ---
  doctor: DoctorResponse | null;
  doctorLoading: boolean;
  doctorMissing: boolean;
  refreshDoctor: () => Promise<void>;
  // --- Shared ---
  hydrated: boolean;
  setSession: (auth: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Patient state
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientMissing, setPatientMissing] = useState(false);

  // Doctor state
  const [doctor, setDoctor] = useState<DoctorResponse | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorMissing, setDoctorMissing] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("hms_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        // ignore corrupted state
      }
    }
    setHydrated(true);
  }, []);

  // ── Patient ──────────────────────────────────────────
  const refreshPatient = useCallback(async () => {
    if (!user || user.role !== "PATIENT") return;
    setPatientLoading(true);
    setPatientMissing(false);
    try {
      const data = await getPatientByUserId(user.userId);
      setPatient(data);
    } catch {
      setPatient(null);
      setPatientMissing(true);
    } finally {
      setPatientLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "PATIENT") refreshPatient();
  }, [user, refreshPatient]);

  // ── Doctor ───────────────────────────────────────────
  // auth-context.tsx
const refreshDoctor = useCallback(async () => {
  console.log("refreshDoctor called", { user }); // ← add this

  if (!user || user.role !== "DOCTOR") {
    console.warn("refreshDoctor skipped — role:", user?.role); // ← add this
    return;
  }

  setDoctorLoading(true);
  setDoctorMissing(false);
  try {
    const data = await getDoctorByUserId(user.userId);
    console.log("doctor fetched ✅", data); // ← add this
    setDoctor(data);
  } catch (err) {
    console.error("doctor fetch failed ❌", err); // ← add this
    setDoctor(null);
    setDoctorMissing(true);
  } finally {
    setDoctorLoading(false);
  }
}, [user]);

  useEffect(() => {
    if (user?.role === "DOCTOR") refreshDoctor();
  }, [user, refreshDoctor]);

  // ── Session ──────────────────────────────────────────
  const setSession = (auth: AuthResponse) => {
    localStorage.setItem("hms_token", auth.token);
    localStorage.setItem("hms_user", JSON.stringify(auth));
    setUser(auth);
  };

  const logout = () => {
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_user");
    setUser(null);
    setPatient(null);
    setDoctor(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patient,
        patientLoading,
        patientMissing,
        refreshPatient,
        doctor,
        doctorLoading,
        doctorMissing,
        refreshDoctor,
        hydrated,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
