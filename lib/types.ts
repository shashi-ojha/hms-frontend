export type Role = "ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTIONIST";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type BillStatus = "PENDING" | "PAID" | "CANCELLED";

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
}

export interface DepartmentResponse {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
}

export interface DoctorResponse {
  id: number;
  userId: number;
  doctorName: string;
  email: string;
  phone: string;
  departmentName: string;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
  bio: string;
  available: boolean;
  createdAt: string;
}

export interface PatientResponse {
  id: number;
  userId: number;
  patientName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  emergencyContactName: string;
  medicalHistory: string;
  createdAt: string;
}

export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  departmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  reason: string;
  notes: string | null;
  amount: number;
  createdAt: string;
}

export interface PrescriptionResponse {
  id: number;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
  createdAt: string;
}

export interface MedicalRecordResponse {
  id: number;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  prescriptions: PrescriptionResponse[];
  createdAt: string;
}

export interface BillResponse {
  id: number;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  departmentName: string;
  consultationFee: number;
  additionalCharges: number;
  totalAmount: number;
  status: BillStatus;
  paymentMethod: string | null;
  notes: string;
  createdAt: string;
}

export interface PatientFileResponse {
  id: number;
  patientId: number;
  patientName: string;
  originalFileName: string;
  fileType: string;
  contentType: string;
  fileSize: number;
  description: string;
  downloadUrl: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ---------- Doctor portal request types ----------
export interface MedicalRecordRequest {
  appointmentId: number;
  diagnosis: string;
  treatment: string;
  notes?: string;
}

export interface PrescriptionRequest {
  medicalRecordId: number;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions?: string;
}

// ---------- Admin portal types ----------
export interface DashboardResponse {
  totalDoctors: number;
  totalPatients: number;
  totalDepartments: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  pendingBillsCount: number;
  pendingBillsAmount: number;
}

export interface DepartmentRequest {
  name: string;
  description: string;
  active?: boolean;
}

export interface DoctorRequest {
  userId: number;
  departmentId: number;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  available?: boolean;
}

export interface DoctorOnboardRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  departmentId: number;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface PatientRequest {
  userId: number;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  emergencyContactName: string;
  medicalHistory?: string;
}

export interface BillRequest {
  appointmentId: number;
  additionalCharges?: number;
  notes?: string;
}