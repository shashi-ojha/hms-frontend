"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AuthResponse, PatientResponse } from "./types";
import { getPatientByUserId } from "./api";

interface AuthContextValue {
  user: AuthResponse | null;
  patient: PatientResponse | null;
  patientLoading: boolean;
  patientMissing: boolean;
  hydrated: boolean;
  setSession: (auth: AuthResponse) => void;
  logout: () => void;
  refreshPatient: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientMissing, setPatientMissing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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
    if (user) refreshPatient();
  }, [user, refreshPatient]);

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
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patient,
        patientLoading,
        patientMissing,
        hydrated,
        setSession,
        logout,
        refreshPatient,
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