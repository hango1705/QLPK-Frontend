// Admin-specific types

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  disable: boolean;
  role?: 'admin' | 'doctor' | 'nurse' | 'patient';
}

export interface Role {
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission {
  name: string;
  description?: string;
}

export interface AuditLog {
  id?: string; // Optional, backend may not return id
  action: string;
  timestamp: string; // ISO string from LocalDateTime
  username: string;
}

export interface CategoryDentalService {
  id: string;
  name: string;
  listDentalServiceEntity?: DentalService[];
}

export interface DentalService {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  categoryDentalServiceId?: string;
}

export interface Prescription {
  name: string;
  dosage?: string;
  duration?: string;
  frequency?: string;
  notes?: string;
  unitPrice: number;
}

export interface RoleRequest {
  name: string;
  description?: string;
}

export interface PermissionRequest {
  name: string;
  description?: string;
}

export interface CategoryDentalServiceRequest {
  name: string;
}

export interface DentalServiceRequest {
  name: string;
  unit: string;
  unitPrice: number;
  categoryDentalServiceId: string;
}

export interface PrescriptionRequest {
  name: string;
  dosage?: string;
  duration?: string;
  frequency?: string;
  notes?: string;
  unitPrice: number;
}

export interface PrescriptionUpdateRequest {
  dosage?: string;
  duration?: string;
  frequency?: string;
  notes?: string;
  unitPrice: number;
}

