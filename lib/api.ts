import axios from "axios";
import type {
  AppointmentResponse,
  AppointmentStatus,
  AuthResponse,
  BillResponse,
  DepartmentResponse,
  DoctorResponse,
  MedicalRecordRequest,
  MedicalRecordResponse,
  Page,
  PatientFileResponse,
  PatientResponse,
  PrescriptionRequest,
  Role,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      localStorage.removeItem("hms_token");
      localStorage.removeItem("hms_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Extracts a friendly message from the backend's error payload shape
export function apiErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;
  const data = anyErr?.response?.data;
  if (!data) return anyErr?.message || fallback;
  if (typeof data.message === "string") return data.message;
  if (data.messages && typeof data.messages === "object") {
    const first = Object.values(data.messages)[0];
    if (typeof first === "string") return first;
  }
  return fallback;
}

// ---------- Auth ----------
export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
}) {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

// ---------- Departments ----------
export async function getDepartments() {
  const { data } = await api.get<DepartmentResponse[]>("/departments");
  return data;
}

// ---------- Doctors ----------
export async function searchDoctors(params: {
  name?: string;
  specialization?: string;
  departmentId?: number;
  minExperience?: number;
  available?: boolean;
  maxFee?: number;
  page?: number;
  size?: number;
}) {
  const { data } = await api.get<Page<DoctorResponse>>("/doctors/search", {
    params,
  });
  return data;
}

// ---------- Patient profile ----------
export async function getPatientByUserId(userId: number) {
  const { data } = await api.get<PatientResponse>(
    `/patients/user/${userId}`
  );
  return data;
}

// ---------- Appointments ----------
export async function bookAppointment(payload: {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  notes?: string;
}) {
  const { data } = await api.post<AppointmentResponse>(
    "/appointments",
    payload
  );
  return data;
}

export async function getPatientAppointments(
  patientId: number,
  page = 0,
  size = 50
) {
  const { data } = await api.get<Page<AppointmentResponse>>(
    `/appointments/patient/${patientId}`,
    { params: { page, size } }
  );
  return data;
}

export async function cancelAppointment(id: number) {
  const { data } = await api.put<AppointmentResponse>(
    `/appointments/${id}/cancel`
  );
  return data;
}

// ---------- Medical records ----------
export async function getPatientHistory(patientId: number) {
  const { data } = await api.get<MedicalRecordResponse[]>(
    `/records/patient/${patientId}/history`
  );
  return data;
}

// ---------- Bills ----------
export async function getPatientBills(patientId: number) {
  const { data } = await api.get<BillResponse[]>(
    `/bills/patient/${patientId}`
  );
  return data;
}

// ---------- Files ----------
export async function getPatientFiles(patientId: number) {
  const { data } = await api.get<PatientFileResponse[]>(
    `/files/patient/${patientId}`
  );
  return data;
}

export async function uploadPatientFile(payload: {
  patientId: number;
  file: File;
  fileType: string;
  description?: string;
}) {
  const form = new FormData();
  form.append("patientId", String(payload.patientId));
  form.append("file", payload.file);
  form.append("fileType", payload.fileType);
  if (payload.description) form.append("description", payload.description);

  const { data } = await api.post<PatientFileResponse>("/files", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// ============================================================
// Doctor Portal
// ============================================================

export async function getDoctorByUserId(userId: number) {
  const { data } = await api.get<DoctorResponse>(`/doctors/user/${userId}`);
  return data;
}

export async function toggleDoctorAvailability(
  doctorId: number,
  available: boolean
) {
  const { data } = await api.put<DoctorResponse>(
    `/doctors/${doctorId}/availability`,
    { available }
  );
  return data;
}

export async function getDoctorAppointments(
  doctorId: number,
  page = 0,
  size = 100
) {
  const { data } = await api.get<Page<AppointmentResponse>>(
    `/appointments/doctor/${doctorId}`,
    { params: { page, size } }
  );
  return data;
}


export async function getDoctorSchedule(doctorId: number, date: string) {
  const { data } = await api.get<AppointmentResponse[]>(
    `/appointments/doctor/${doctorId}/schedule`,
    { params: { date } }
  );
  return data;
}

export async function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus
) {
  const { data } = await api.put<AppointmentResponse>(
    `/appointments/${id}/status`,
    { status }
  );
  return data;
}

export async function getPatientById(id: number) {
  const { data } = await api.get<PatientResponse>(`/patients/${id}`);
  return data;
}

export async function searchPatients(params: {
  name?: string;
  bloodGroup?: string;
  email?: string;
  page?: number;
  size?: number;
}) {
  const { data } = await api.get<Page<PatientResponse>>("/patients/search", {
    params,
  });
  return data;
}

export async function getRecordByAppointment(appointmentId: number) {
  const { data } = await api.get<MedicalRecordResponse>(
    `/records/appointment/${appointmentId}`
  );
  return data;
}

export async function createMedicalRecord(payload: MedicalRecordRequest) {
  const { data } = await api.post<MedicalRecordResponse>(
    "/records",
    payload
  );
  return data;
}

export async function updateMedicalRecord(
  id: number,
  payload: Partial<MedicalRecordRequest>
) {
  const { data } = await api.put<MedicalRecordResponse>(
    `/records/${id}`,
    payload
  );
  return data;
}

export async function createPrescription(payload: PrescriptionRequest) {
  const { data } = await api.post(`/prescriptions`, payload);
  return data;
}

export async function deletePrescription(id: number) {
  await api.delete(`/prescriptions/${id}`);
}

export async function getDoctorById(id: number) {
  const { data } = await api.get<DoctorResponse>(`/doctors/${id}`);
  return data;
}