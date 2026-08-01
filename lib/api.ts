import axios from "axios";
import type {
  AppointmentResponse,
  AppointmentStatus,
  AuthResponse,
  BillRequest,
  BillResponse,
  DashboardResponse,
  DepartmentRequest,
  DepartmentResponse,
  DoctorOnboardRequest,
  DoctorRequest,
  DoctorResponse,
  MedicalRecordRequest,
  MedicalRecordResponse,
  Page,
  PatientFileResponse,
  PatientRequest,
  PatientResponse,
  PrescriptionRequest,
  Role,
  UserSummary,
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

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const { data } = await api.post<string>("/auth/change-password", payload);
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

export async function getAvailableSlots(doctorId: number, date: string) {
  const { data } = await api.get<string[]>(
    `/doctors/${doctorId}/available-slots`,
    { params: { date } }
  );
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

export async function deletePatientFile(id: number) {
  await api.delete(`/files/${id}`);
}

// Files are served from a protected endpoint, so a plain <a href> won't
// include the auth header. Fetch as a blob and trigger the download manually.
export async function downloadPatientFileBlob(
  downloadUrl: string,
  filename: string
) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("hms_token") : null;
  const response = await fetch(`${API_BASE_URL}${downloadUrl}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
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

export async function searchAllAppointments(params: {
  status?: AppointmentStatus;
  doctorId?: number;
  patientId?: number;
  departmentId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}) {
  const { data } = await api.get<Page<AppointmentResponse>>(
    "/appointments/search",
    { params }
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

// ============================================================
// Admin Portal
// ============================================================

export async function getDashboardStats() {
  const { data } = await api.get<DashboardResponse>("/dashboard/stats");
  return data;
}

export async function createDepartment(payload: DepartmentRequest) {
  const { data } = await api.post<DepartmentResponse>("/departments", payload);
  return data;
}

export async function updateDepartment(id: number, payload: DepartmentRequest) {
  const { data } = await api.put<DepartmentResponse>(
    `/departments/${id}`,
    payload
  );
  return data;
}

export async function deleteDepartment(id: number) {
  await api.delete(`/departments/${id}`);
}

export async function getAllDoctors() {
  const { data } = await api.get<DoctorResponse[]>("/doctors");
  return data;
}

export async function createDoctor(payload: DoctorRequest) {
  const { data } = await api.post<DoctorResponse>("/doctors", payload);
  return data;
}

export async function onboardDoctor(payload: DoctorOnboardRequest) {
  const { data } = await api.post<DoctorResponse>("/doctors/onboard", payload);
  return data;
}

export async function updateDoctor(id: number, payload: Partial<DoctorRequest>) {
  const { data } = await api.put<DoctorResponse>(`/doctors/${id}`, payload);
  return data;
}

export async function deleteDoctor(id: number) {
  await api.delete(`/doctors/${id}`);
}

export async function getAllPatients(page = 0, size = 100) {
  const { data } = await api.get<Page<PatientResponse>>("/patients", {
    params: { page, size },
  });
  return data;
}

export async function getAllBills(page = 0, size = 100) {
  const { data } = await api.get<Page<BillResponse>>("/bills", {
    params: { page, size },
  });
  return data;
}

export async function payBill(id: number, paymentMethod: string) {
  const { data } = await api.put<BillResponse>(`/bills/${id}/pay`, {
    paymentMethod,
  });
  return data;
}

export async function getUsersByRole(role: Role) {
  const { data } = await api.get<UserSummary[]>("/users", {
    params: { role },
  });
  return data;
}

// ============================================================
// Receptionist Portal
// ============================================================

export async function createPatientRecord(payload: PatientRequest) {
  const { data } = await api.post<PatientResponse>("/patients", payload);
  return data;
}

export async function createBill(payload: BillRequest) {
  const { data } = await api.post<BillResponse>("/bills", payload);
  return data;
}