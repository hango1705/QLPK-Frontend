import apiClient from './client';
import type {
  ApiEnvelope,
  AppointmentSummary,
  DoctorSummary,
  TreatmentPlan,
} from '@/types/doctor';
import type { PatientResponse } from './patient';

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
    const allAppointments: AppointmentSummary[] = [];
    const seenIds = new Set<string>();
    
    appointmentArrays.forEach((appointments) => {
      appointments.forEach((appointment) => {
        if (!seenIds.has(appointment.id)) {
          seenIds.add(appointment.id);
          allAppointments.push(appointment);
        }
      });
    });

    return allAppointments;
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
};

