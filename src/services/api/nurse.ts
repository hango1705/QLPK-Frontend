import apiClient from './client';
import type {
  ApiEnvelope,
  AppointmentSummary,
  DoctorSummary,
  TreatmentPlan,
} from '@/types/doctor';
import type { PatientResponse, CostResponse, CostPaymentUpdateRequest } from './patient';

type ApiPayload<T> = ApiEnvelope<T> | T;

const unwrap = <T>(payload: ApiPayload<T>): T => {
  if (payload && typeof payload === 'object' && 'result' in payload) {
    return ((payload as ApiEnvelope<T>).result ?? (payload as T)) as T;
  }
  return payload as T;
};

export interface NurseInfo {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  gender?: string;
  dob?: string;
}

export interface NursePick {
  id: string;
  fullName: string;
}

export const nurseAPI = {
  /**
   * Get nurse information by nurse ID
   * @param nurseId - Nurse ID
   * @returns NurseInfo with full name and phone
   */
  getNurseInfo: async (nurseId: string): Promise<NurseInfo> => {
    const response = await apiClient.get(`/api/v1/nurse/getInfo/${nurseId}`);
    return unwrap<NurseInfo>(response.data);
  },

  /**
   * Get nurse information by user ID
   * @param userId - User ID
   * @returns NurseInfo with full name and phone
   */
  getNurseInfoByUserId: async (userId: string): Promise<NurseInfo> => {
    const response = await apiClient.get(`/api/v1/nurse/user/${userId}`);
    return unwrap<NurseInfo>(response.data);
  },

  /**
   * Get all nurses for selection/pick
   * @returns List of nurses with id and full name
   */
  getAllNursesForPick: async (): Promise<NursePick[]> => {
    const response = await apiClient.get('/api/v1/nurse/pick');
    return unwrap<NursePick[]>(response.data);
  },

  /**
   * Get scheduled appointments for a specific doctor
   * @param doctorId - Doctor ID
   * @returns List of scheduled appointments
   */
  getAppointmentsByDoctor: async (doctorId: string): Promise<AppointmentSummary[]> => {
    const response = await apiClient.get(`/api/v1/nurse/appointment/scheduled/${doctorId}`);
    return unwrap<AppointmentSummary[]>(response.data);
  },

  /**
   * Get all appointments (all statuses including cancelled) for a specific doctor
   * @param doctorId - Doctor ID
   * @returns List of all appointments (scheduled, done, cancelled)
   */
  getAllAppointmentsByDoctor: async (doctorId: string): Promise<AppointmentSummary[]> => {
    // Use nurse API endpoint to get all appointments including cancelled
    const response = await apiClient.get(`/api/v1/nurse/appointment/all/${doctorId}`);
    return unwrap<AppointmentSummary[]>(response.data);
  },

  /**
   * Get all appointments from all doctors
   * @param doctorIds - Optional array of doctor IDs to filter. If not provided, gets all doctors first
   * @returns List of all appointments from all doctors
   */
  getAllAppointments: async (doctorIds?: string[]): Promise<AppointmentSummary[]> => {
    // If doctorIds not provided, get all doctors first
    let doctorList = doctorIds;
    if (!doctorList || doctorList.length === 0) {
      const doctors = await nurseAPI.getAllDoctors();
      doctorList = doctors.map((d) => d.id);
    }

    // Fetch ALL appointments (all statuses) for all doctors in parallel
    const appointmentPromises = doctorList.map((doctorId) =>
      nurseAPI.getAllAppointmentsByDoctor(doctorId).catch(() => [] as AppointmentSummary[])
    );

    const appointmentArrays = await Promise.all(appointmentPromises);
    
    // Merge and deduplicate by appointment ID
    // When duplicates are found, keep the one with doctorId (prefer the latest one)
    const allAppointments: AppointmentSummary[] = [];
    const appointmentMap = new Map<string, AppointmentSummary>();
    
    appointmentArrays.forEach((appointments) => {
      appointments.forEach((appointment) => {
        const existing = appointmentMap.get(appointment.id);
        // If appointment doesn't exist in map, add it
        // If it exists but doesn't have doctorId, replace it with the new one (which should have doctorId)
        if (!existing || (!existing.doctorId && appointment.doctorId)) {
          appointmentMap.set(appointment.id, appointment);
        }
      });
    });

    // Convert map values to array
    return Array.from(appointmentMap.values());
  },

  /**
   * Get all treatment plans assigned to the current nurse
   * @returns List of treatment plans
   */
  getMyTreatmentPlans: async (): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get('/api/v1/nurse/myTreatmentPlans');
    return unwrap<TreatmentPlan[]>(response.data);
  },

  /**
   * Get patient basic information
   * @param patientId - Patient ID
   * @returns PatientResponse with full patient information
   */
  getPatientById: async (patientId: string): Promise<PatientResponse> => {
    const response = await apiClient.get(`/api/v1/nurse/${patientId}`);
    return unwrap<PatientResponse>(response.data);
  },

  /**
   * Get patient basic information by user ID
   * @param userId - User ID
   * @returns PatientResponse with full patient information
   */
  getPatientByUserId: async (userId: string): Promise<PatientResponse> => {
    const response = await apiClient.get(`/api/v1/nurse/patient/user/${userId}`);
    return unwrap<PatientResponse>(response.data);
  },

  /**
   * Get all doctors
   * @returns List of all doctors
   */
  getAllDoctors: async (): Promise<DoctorSummary[]> => {
    const response = await apiClient.get('/api/v1/nurse/doctors');
    return unwrap<DoctorSummary[]>(response.data);
  },

  /**
   * Get doctor information by doctor ID
   * @param doctorId - Doctor ID
   * @returns DoctorSummary with doctor information
   */
  getDoctorById: async (doctorId: string): Promise<DoctorSummary> => {
    const response = await apiClient.get(`/api/v1/nurse/doctors/${doctorId}`);
    return unwrap<DoctorSummary>(response.data);
  },

  /**
   * Get doctor information by user ID
   * @param userId - User ID
   * @returns DoctorSummary with doctor information
   */
  getDoctorByUserId: async (userId: string): Promise<DoctorSummary> => {
    const response = await apiClient.get(`/api/v1/doctor/user/${userId}`);
    return unwrap<DoctorSummary>(response.data);
  },

  /**
   * Update appointment notification status (mark as notified)
   * @param appointmentId - Appointment ID
   * @returns Updated appointment response
   */
  updateAppointmentNotification: async (appointmentId: string): Promise<AppointmentSummary> => {
    const response = await apiClient.put(`/api/v1/nurse/appointment/${appointmentId}`);
    return unwrap<AppointmentSummary>(response.data);
  },

  /**
   * Update payment cost for a patient (nurse can pay on behalf of patient)
   * @param costId - Cost ID (can be treatment phase ID or examination ID)
   * @param request - Payment update request with payment method and status
   * @returns Updated cost response
   */
  updatePaymentCost: async (costId: string, request: CostPaymentUpdateRequest): Promise<CostResponse> => {
    const response = await apiClient.put(`/api/v1/cost/${costId}`, request);
    return unwrap<CostResponse>(response.data);
  },

  /**
   * Get cost detail by id (for checking payment status in nurse dashboard)
   * Roles: nurse/admin (UPDATE_PAYMENT_COST)
   * @param costId - Cost ID (same as treatment phase ID)
   * @returns CostResponse
   */
  getCostById: async (costId: string): Promise<CostResponse> => {
    const response = await apiClient.get(`/api/v1/cost/${costId}`);
    return unwrap<CostResponse>(response.data);
  },
};

