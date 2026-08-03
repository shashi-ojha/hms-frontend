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
  NotificationItem,
  Page,
  PatientFileResponse,
  PatientRequest,
  PatientResponse,
  PaymentOrder,
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

// ✅ Download file with JWT token
export async function downloadFile(fileName: string) {
  const res = await api.get(
    `/files/download/${fileName}`,
    {
      responseType: "blob",
    }
  );
  return res.data;
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

export async function createPaymentOrder(billId: number) {
  const { data } = await api.post<PaymentOrder>(
    `/payments/create-order/${billId}`
  );
  return data;
}

export async function verifyPayment(payload: {
  billId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { data } = await api.post<string>("/payments/verify", payload);
  return data;
}

// ============================================================
// Notifications
// ============================================================

export async function getNotifications() {
  const { data } = await api.get<NotificationItem[]>("/notifications");
  return data;
}

export async function getUnreadNotificationCount() {
  const { data } = await api.get<{ count: number }>(
    "/notifications/unread-count"
  );
  return data.count;
}

export async function markNotificationRead(id: number) {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.put("/notifications/read-all");
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

// Search user by email or phone
export async function searchUserByEmailOrPhone(query: string) {
  const res = await api.get(
    `/users/search?query=${encodeURIComponent(query)}`
  );
  return res.data; // returns null if not found
}

// ─── User / Approval APIs ─────────────────────────────────

// Search user by email or phone
// export async function searchUserByEmailOrPhone(query: string) {
//   const res = await api.get(
//     `/users/search?query=${encodeURIComponent(query)}`
//   );
//   return res.data;
// }

// Get all pending patients
export async function getPendingPatients() {
  const res = await api.get("/users/pending-patients");
  return res.data;
}

// Get pending patients count (sidebar badge)
export async function getPendingPatientsCount() {
  const res = await api.get("/users/pending-patients/count");
  return res.data;
}

// Get single pending patient by userId
export async function getPendingPatientById(userId: number) {
  const res = await api.get(`/users/search?query=${userId}`);
  return res.data;
}

// Approve patient
export async function approvePatient(
  userId: number,
  data: {
    dateOfBirth: string;
    bloodGroup: string;
    address: string;
    emergencyContactName: string;
    emergencyContact: string;
    medicalHistory?: string;
  }
) {
  const res = await api.post(`/users/${userId}/approve`, data);
  return res.data;
}

// Reject patient
export async function rejectPatient(userId: number) {
  const res = await api.post(`/users/${userId}/reject`);
  return res.data;
}

// ─── Doctors ──────────────────────────────────────────────

// Get doctors by department
export async function getDoctorsByDepartment(
  departmentId: number,
  available?: boolean         // ✅ Added
) {
  const params = available !== undefined
    ? `?available=${available}`
    : "";
  const res = await api.get(
    `/doctors/department/${departmentId}${params}`
  );
  return res.data;
}

// Get available doctors only
export async function getAvailableDoctors() {
  const res = await api.get("/doctors/available");
  return res.data;
}

// ─── Patient Profile ──────────────────────────────────────

// Get my own patient profile
export async function getMyPatientProfile() {
  const res = await api.get("/patients/me");
  return res.data;
}

// Update my own patient profile
export async function updateMyPatientProfile(data: {
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContact?: string;
  medicalHistory?: string;
}) {
  const res = await api.put("/patients/me", data);
  return res.data;
}

// Get bill by ID
export async function getBillById(id: number) {
  const res = await api.get(`/bills/${id}`);
  return res.data;
}

// Get bill by appointment
export async function getBillByAppointment(appointmentId: number) {
  const res = await api.get(`/bills/appointment/${appointmentId}`);
  return res.data;
}

// Get today's appointments
export async function getTodaysAppointments() {
  const res = await api.get("/appointments/today");
  return res.data;
}

// Delete appointment (Admin only)
export async function deleteAppointment(id: number) {
  const res = await api.delete(`/appointments/${id}`);
  return res.data;
}

// Get appointment by ID
export async function getAppointmentById(id: number) {
  const res = await api.get(`/appointments/${id}`);
  return res.data;
}

// Update patient (Admin)
export async function updatePatient(
  id: number,
  data: {
    dateOfBirth?: string;
    bloodGroup?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContact?: string;
    medicalHistory?: string;
  }
) {
  const res = await api.put(`/patients/${id}`, data);
  return res.data;
}

// Delete patient (Admin)
export async function deletePatient(id: number) {
  const res = await api.delete(`/patients/${id}`);
  return res.data;
}

// Get all medical records (Admin)
export async function getAllRecords() {
  const res = await api.get("/records");
  return res.data;
}

// Get prescriptions by record ID
export async function getPrescriptionsByRecord(recordId: number) {
  const res = await api.get(
    `/prescriptions/record/${recordId}`
  );
  return res.data;
}

// Add prescription
export async function addPrescription(data: {
  medicalRecordId: number;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions?: string;
}) {
  const res = await api.post("/prescriptions", data);
  return res.data;
}

// Get appointments by doctor with pagination
export async function getAppointmentsByDoctor(
  doctorId: number,
  page: number = 0,
  size: number = 100
) {
  const res = await api.get(
    `/appointments/doctor/${doctorId}?page=${page}&size=${size}`
  );
  return res.data;
}

// Get doctor by ID
export async function getDoctorById(id: number) {
  const res = await api.get(`/doctors/${id}`);
  return res.data;
}

// Get department by ID
export async function getDepartmentById(id: number) {
  const res = await api.get(`/departments/${id}`);
  return res.data;
}

// Get bill by appointment ID
export async function getBillByAppointmentId(
  appointmentId: number
) {
  const res = await api.get(
    `/bills/appointment/${appointmentId}`
  );
  return res.data;
}

// Get patient files by type
export async function getPatientFilesByType(
  patientId: number,
  fileType: string
) {
  const res = await api.get(
    `/files/patient/${patientId}/type/${fileType}`
  );
  return res.data;
}


