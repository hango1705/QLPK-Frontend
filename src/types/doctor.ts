export interface ApiEnvelope<T> {
  code?: number;
  result?: T;
}

export interface ImageAsset {
  publicId: string;
  url: string;
  type: string;
}

export interface DentalService {
  id?: string;
  name: string;
  unit: string;
  unitPrice: number;
}

export interface DentalServiceOrder {
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  cost: number;
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
  unitPrice: number;
}

export interface PrescriptionOrder {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
  unitPrice: number;
  quantity: number;
  cost: number;
}

export interface AppointmentSummary {
  id: string;
  dateTime: string;
  type: string;
  notes: string;
  status: string;
  listDentalServicesEntity: DentalService[];
  doctorFullName?: string; // Optional - backend không trả về field này
  doctorSpecialization?: string; // Optional - backend không trả về field này
  patientId?: string; // Patient ID from backend (AppointmentResponse có field này)
  doctorId?: string; // Doctor ID from backend (AppointmentResponse có field này)
  notification?: string; // Notification status (e.g., "Done", "Pending")
}

export interface ExaminationSummary {
  id: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  treatment: string;
  examined_at: string;
  totalCost: number;
  listImage?: ImageAsset[];
  listDentalServicesEntityOrder?: DentalServiceOrder[];
  listPrescriptionOrder?: PrescriptionOrder[];
  createAt?: string;
  listComment?: string[]; // Comments from Doctor LV2
}

export interface TreatmentPlan {
  id: string;
  title: string;
  description: string;
  duration: string;
  notes: string;
  status: string;
  totalCost: number;
  doctorId?: string; // Doctor ID from backend
  doctorFullname: string;
  nurseId?: string; // Nurse ID from backend
  nurseFullname?: string; // Tên y tá
  createAt: string;
  patientId?: string; // Patient ID from backend (TreatmentPlansResponse có field này)
  patientName?: string; // Patient name (có thể có trong response)
}

export interface TreatmentPhase {
  id: string;
  phaseNumber: string;
  description: string;
  cost: number;
  status: string;
  paymentStatus?: string;
  startDate: string;
  endDate: string;
  nextAppointment?: string;
  listDentalServicesEntityOrder?: DentalServiceOrder[];
  listPrescriptionOrder?: PrescriptionOrder[];
  listImage?: ImageAsset[];
  listComment?: string[]; // Comments from Doctor LV2
}

export interface DoctorSummary {
  id: string;
  fullName: string;
  specialization: string;
  phone?: string;
  email?: string;
  address?: string;
  gender?: string;
  dob?: string;
  licenseNumber?: string;
  yearsExperience?: number;
}

export interface BookingSlot {
  dateTime: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  gender?: string;
  dob?: string;
}

export type AppointmentFilter = 'all' | 'scheduled';

