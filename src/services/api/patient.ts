import apiClient from './client';

export interface PatientResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  emergencyContactName?: string;
  emergencyPhoneNumber?: string;
  bloodGroup?: string;
  allergy?: string;
  medicalHistory?: string;
}

export interface BookingDateTimeResponse {
  dateTime: string; // Format: "HH:mm dd/MM/yyyy"
}

export interface TreatmentPlansResponse {
  id: string;
  title: string;
  description: string;
  duration: string;
  notes: string;
  status: string;
  totalCost: number;
  doctorFullname: string;
  createAt: string; // Format: "dd/MM/yyyy"
}

// Helper to unwrap ApiResponses
const unwrap = <T,>(response: any): T => {
  if (response?.data?.result !== undefined) {
    return response.data.result;
  }
  return response.data;
};

export const patientAPI = {
  /**
   * Get patient information by patient ID
   * Roles: ADMIN (any patient), DOCTOR (when examining, from appointment)
   * @param patientId - Patient ID
   * @returns PatientResponse with full patient information including emergency contact and medical info
   */
  getPatientById: async (patientId: string): Promise<PatientResponse> => {
    const response = await apiClient.get(`/api/v1/patient/${patientId}`);
    return unwrap<PatientResponse>(response);
  },

  /**
   * Get current logged-in patient's information
   * @returns PatientResponse
   */
  getMyInfo: async (): Promise<PatientResponse> => {
    const response = await apiClient.get('/api/v1/patient/myInfo');
    return unwrap<PatientResponse>(response);
  },

  /**
   * Get available booking date times for a doctor
   * Used for patient appointment booking to see available slots
   * @param doctorId - Doctor ID
   * @returns List of available booking date times
   */
  getBookingDateTime: async (doctorId: string): Promise<BookingDateTimeResponse[]> => {
    const response = await apiClient.get(`/api/v1/patient/appointment/bookingDateTime/${doctorId}`);
    return unwrap<BookingDateTimeResponse[]>(response);
  },

  /**
   * Get all treatment plans for a specific patient
   * Roles: ADMIN (any patient), DOCTOR (patients related to appointments/examinations)
   * @param patientId - Patient ID
   * @returns List of treatment plans for the patient
   */
  getTreatmentPlansByPatientId: async (patientId: string): Promise<TreatmentPlansResponse[]> => {
    const response = await apiClient.get(`/api/v1/patient/treatmentPlans/${patientId}`);
    return unwrap<TreatmentPlansResponse[]>(response);
  },
};

