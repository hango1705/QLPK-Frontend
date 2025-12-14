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
  doctorFullname?: string;
  doctorId?: string;
  nurseId?: string;
  patientId?: string;
  createAt: string; // Format: "dd/MM/yyyy"
}

export interface AppointmentResponse {
  id: string;
  dateTime: string;
  type: string;
  notes: string;
  status: string;
  doctorId?: string;
  patientId?: string;
  listDentalServicesEntity?: Array<{ id: string; name: string; unit: string; unitPrice: number }>;
}

export interface ToothResponse {
  id: string;
  toothNumber: string;
  status: string;
}

export interface ToothRequest {
  toothNumber: string;
  status: string;
}

export interface ToothUpdateRequest {
  status: string;
}

export interface CostResponse {
  id: string;
  title: string;
  paymentMethod: string;
  status: string;
  totalCost: number;
  vnpTxnRef?: string;
  paymentDate: string; // Format: "dd/MM/yyyy"
  listDentalServiceEntityOrder?: Array<{
    name: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    cost: number;
  }>;
  listPrescriptionOrder?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
    unitPrice: number;
    quantity: number;
    cost: number;
  }>;
}

export interface VNPayResponse {
  code: string;
  message: string;
  paymentUrl: string;
}

export interface ExaminationResponse {
  id: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  treatment: string;
  examined_at: string;
  totalCost: number;
  appointmentId?: string;
  listImage?: Array<{ publicId: string; url: string; type: string }>;
  listDentalServicesEntityOrder?: Array<{
    name: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    cost: number;
  }>;
  listPrescriptionOrder?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
    unitPrice: number;
    quantity: number;
    cost: number;
  }>;
}

export interface EmergencyContactRequest {
  emergencyContactName: string;
  emergencyPhoneNumber: string;
}

export interface MedicalInformationRequest {
  bloodGroup?: string;
  allergy?: string;
  medicalHistory?: string;
}

export interface AppointmentBookingRequest {
  doctorId: string;
  dateTime: string;
  type: string;
  notes?: string;
  listDentalServicesEntity?: Array<{ id: string }>;
}

export interface AppointmentUpdateRequest {
  doctorId?: string;
  dateTime?: string;
  type?: string;
  notes?: string;
  listDentalServicesEntity?: Array<{ id: string }>;
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

  /**
   * Get all treatment plans for current logged-in patient
   * @returns List of treatment plans
   */
  getMyTreatmentPlans: async (): Promise<TreatmentPlansResponse[]> => {
    try {
      const response = await apiClient.get('/api/v1/patient/myTreatmentPlans');
      return unwrap<TreatmentPlansResponse[]>(response);
    } catch (error: any) {
      // Trả về empty array thay vì throw error để app không crash
      return [];
    }
  },

  /**
   * Update emergency contact information
   * @param patientId - Patient ID
   * @param data - Emergency contact data
   * @returns Updated emergency contact response
   */
  updateEmergencyContact: async (
    patientId: string,
    data: EmergencyContactRequest,
  ): Promise<{ emergencyContactName: string; emergencyPhoneNumber: string }> => {
    const response = await apiClient.put(`/api/v1/patient/emergencyContact/${patientId}`, data);
    return unwrap(response);
  },

  /**
   * Update medical information (blood group, allergy, medical history)
   * @param patientId - Patient ID
   * @param data - Medical information data
   * @returns Updated medical information response
   */
  updateMedicalInformation: async (
    patientId: string,
    data: MedicalInformationRequest,
  ): Promise<{ bloodGroup?: string; allergy?: string; medicalHistory?: string }> => {
    const response = await apiClient.put(`/api/v1/patient/medicalInformation/${patientId}`, data);
    return unwrap(response);
  },

  /**
   * Book a new appointment
   * @param data - Appointment booking data
   * @returns Created appointment response
   */
  bookAppointment: async (data: AppointmentBookingRequest): Promise<AppointmentResponse> => {
    const response = await apiClient.post('/api/v1/patient/appointment/booking', data);
    return unwrap<AppointmentResponse>(response);
  },

  /**
   * Cancel an appointment
   * @param appointmentId - Appointment ID
   * @returns Updated appointment response
   */
  cancelAppointment: async (appointmentId: string): Promise<AppointmentResponse> => {
    const response = await apiClient.put(`/api/v1/patient/appointment/booking/cancel/${appointmentId}`);
    return unwrap<AppointmentResponse>(response);
  },

  /**
   * Update an existing appointment
   * @param appointmentId - Appointment ID
   * @param data - Updated appointment data
   * @returns Updated appointment response
   */
  updateAppointment: async (
    appointmentId: string,
    data: AppointmentUpdateRequest,
  ): Promise<AppointmentResponse> => {
    const response = await apiClient.put(`/api/v1/patient/appointment/booking/update/${appointmentId}`, data);
    return unwrap<AppointmentResponse>(response);
  },

  /**
   * Get all appointments for current logged-in patient
   * @returns List of appointments
   */
  getMyAppointments: async (): Promise<AppointmentResponse[]> => {
    const response = await apiClient.get('/api/v1/patient/myAppointment');
    return unwrap<AppointmentResponse[]>(response);
  },

  /**
   * Get all examinations for current logged-in patient
   * @returns List of examinations
   */
  getMyExaminations: async (): Promise<ExaminationResponse[]> => {
    const response = await apiClient.get('/api/v1/patient/myExamination');
    return unwrap<ExaminationResponse[]>(response);
  },

  /**
   * Get examination detail by ID
   * @param examinationId - Examination ID
   * @returns Examination detail
   */
  getExaminationById: async (examinationId: string): Promise<ExaminationResponse> => {
    const response = await apiClient.get(`/api/v1/patient/examination/${examinationId}`);
    return unwrap<ExaminationResponse>(response);
  },

  /**
   * Get all tooth statuses for a patient
   * @param patientId - Patient ID
   * @returns List of tooth statuses
   */
  getPatientTeeth: async (patientId: string): Promise<ToothResponse[]> => {
    const response = await apiClient.get(`/api/v1/patient/${patientId}/tooth`);
    return unwrap<ToothResponse[]>(response);
  },

  /**
   * Create or update tooth status for a patient
   * @param patientId - Patient ID
   * @param data - Tooth data (toothNumber, status)
   * @returns Created/updated tooth response
   */
  createToothStatus: async (patientId: string, data: ToothRequest): Promise<ToothResponse> => {
    const response = await apiClient.post(`/api/v1/patient/${patientId}/tooth`, data);
    return unwrap<ToothResponse>(response);
  },

  /**
   * Update tooth status by tooth ID
   * @param toothId - Tooth ID
   * @param data - Updated tooth status
   * @returns Updated tooth response
   */
  updateToothStatus: async (toothId: string, data: ToothUpdateRequest): Promise<ToothResponse> => {
    const response = await apiClient.put(`/api/v1/patient/tooth/${toothId}`, data);
    return unwrap<ToothResponse>(response);
  },

  /**
   * Get all costs for current logged-in patient
   * Role: PATIENT
   * @returns List of cost records
   */
  getAllMyCost: async (): Promise<CostResponse[]> => {
    const response = await apiClient.get('/api/v1/cost');
    return unwrap<CostResponse[]>(response);
  },

  /**
   * Create VNPay payment URL
   * Role: PATIENT
   * @param params - Optional query parameters (amount, orderId, etc.)
   * @returns VNPay payment URL response
   */
  createVnPayPayment: async (params?: Record<string, string>): Promise<VNPayResponse> => {
    const response = await apiClient.get('/api/v1/payment/vnPay', {
      params,
    });
    return unwrap<VNPayResponse>(response);
  },

  /**
   * Update cost payment information
   * Role: PATIENT
   * @param costId - Cost ID
   * @param data - Payment update data (paymentMethod, status, vnpTxnRef)
   * @returns Updated cost response
   */
  updateCostPayment: async (
    costId: string,
    data: { paymentMethod: string; status: string; vnpTxnRef?: string },
  ): Promise<CostResponse> => {
    const response = await apiClient.put(`/api/v1/cost/${costId}`, data);
    return unwrap<CostResponse>(response);
  },
};

