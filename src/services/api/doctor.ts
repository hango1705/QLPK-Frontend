import apiClient from './client';
import type {
  ApiEnvelope,
  AppointmentFilter,
  AppointmentSummary,
  DentalService,
  DentalServiceOrder,
  DoctorSummary,
  ExaminationSummary,
  ImageAsset,
  PrescriptionItem,
  PrescriptionOrder,
  TreatmentPhase,
  TreatmentPlan,
  UserProfile,
} from '@/types/doctor';

type ApiPayload<T> = ApiEnvelope<T> | T;

const unwrap = <T>(payload: ApiPayload<T>): T => {
  if (!payload) {
    return payload as T;
  }
  
  // Handle case where payload is a JSON string
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      // Recursively call unwrap with parsed object
      return unwrap<T>(parsed);
    } catch (e) {
      // If it's not valid JSON, return empty array for array types
      if (Array.isArray([] as T)) {
        return [] as T;
      }
      return payload as T;
    }
  }
  
  // Handle ApiEnvelope format: { code: number, result: T }
  if (typeof payload === 'object' && 'result' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    const result = envelope.result;
    
    // If result is undefined or null, try to return the payload itself
    if (result === undefined || result === null) {
      // For arrays, return empty array instead of the envelope
      if (Array.isArray(payload)) {
        return [] as T;
      }
      return payload as T;
    }
    
    // Ensure result is the correct type
    // If T is an array type and result is an array, return it directly
    if (Array.isArray(result)) {
      return result as T;
    }
    
    return result;
  }
  
  // If payload is already the expected type (direct array/object)
  // Handle case where payload might be an array directly
  if (Array.isArray(payload)) {
    return payload as T;
  }
  
  return payload as T;
};

const appendCollection = <T extends Record<string, any>>(
  formData: FormData,
  field: string,
  collection?: T[],
) => {
  if (!collection?.length) return;
  collection.forEach((item, index) => {
    Object.entries(item).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      formData.append(`${field}[${index}].${key}`, String(value));
    });
  });
};

const appendFiles = (formData: FormData, field: string, files?: File[]) => {
  if (!files?.length) return;
  files.forEach((file) => formData.append(field, file));
};

const appendStrings = (formData: FormData, field: string, values?: string[]) => {
  if (!values?.length) return;
  values.forEach((value) => formData.append(field, value));
};

export interface ExaminationRequestPayload {
  symptoms: string;
  diagnosis: string;
  notes: string;
  treatment: string;
  totalCost: number;
  listDentalServicesEntityOrder?: DentalServiceOrder[];
  listPrescriptionOrder?: PrescriptionOrder[];
  listImageXray?: File[];
  listImageFace?: File[];
  listImageTeeth?: File[];
}

export interface ExaminationUpdatePayload extends ExaminationRequestPayload {
  listDeleteImageByPublicId?: string[];
}

export interface TreatmentPhasePayload {
  phaseNumber: string;
  description: string;
  startDate: string; // dd/MM/yyyy
  endDate: string; // dd/MM/yyyy
  cost: number;
  nextAppointment?: string; // HH:mm dd/MM/yyyy
  status?: string;
  listDentalServicesEntityOrder?: DentalServiceOrder[];
  listPrescriptionOrder?: PrescriptionOrder[];
  listImageXray?: File[];
  listImageFace?: File[];
  listImageTeeth?: File[];
  listDeleteImageByPublicId?: string[];
}

export interface TreatmentPlanPayload {
  title: string;
  description: string;
  duration: string;
  notes: string;
  examinationId: string;
  nurseId?: string; // Optional - only include if nurse is assigned
  doctorId?: string; // Optional - only for DOCTORLV2 with PICK_DOCTOR permission
}

export interface TreatmentPlanUpdatePayload {
  id?: string;               // Một số backend dùng id trong body
  treatmentPlansId?: string; // Một số implementation khác dùng treatmentPlansId
  title: string;
  description: string;
  duration: string;
  notes: string;
  status: string;
  nurseId?: string;  // Optional - Backend TreatmentPlansUpdateRequest has nurseId field
}

const buildExaminationFormData = (payload: ExaminationRequestPayload | ExaminationUpdatePayload) => {
  const formData = new FormData();
  formData.append('symptoms', payload.symptoms ?? '');
  formData.append('diagnosis', payload.diagnosis ?? '');
  formData.append('notes', payload.notes ?? '');
  formData.append('treatment', payload.treatment ?? '');
  formData.append('totalCost', String(payload.totalCost ?? 0));

  appendCollection(formData, 'listDentalServicesEntityOrder', payload.listDentalServicesEntityOrder);
  appendCollection(formData, 'listPrescriptionOrder', payload.listPrescriptionOrder);

  appendFiles(formData, 'listImageXray', payload.listImageXray);
  appendFiles(formData, 'listImageFace', payload.listImageFace);
  appendFiles(formData, 'listImageTeeth', payload.listImageTeeth);

  if ('listDeleteImageByPublicId' in payload) {
    appendStrings(formData, 'listDeleteImageByPublicId', payload.listDeleteImageByPublicId);
  }

  return formData;
};

const buildPhaseFormData = (payload: TreatmentPhasePayload) => {
  const formData = new FormData();
  formData.append('phaseNumber', payload.phaseNumber ?? '');
  formData.append('description', payload.description ?? '');
  formData.append('startDate', payload.startDate ?? '');
  // endDate is required by backend, use startDate if not provided
  formData.append('endDate', payload.endDate || payload.startDate || '');
  formData.append('cost', String(payload.cost ?? 0));
  if (payload.status) {
    formData.append('status', payload.status);
  }
  if (payload.nextAppointment) {
    formData.append('nextAppointment', payload.nextAppointment);
  }

  // Append collections with proper Spring format
  if (payload.listDentalServicesEntityOrder && payload.listDentalServicesEntityOrder.length > 0) {
    payload.listDentalServicesEntityOrder.forEach((item, index) => {
      Object.entries(item).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(`listDentalServicesEntityOrder[${index}].${key}`, String(value));
        }
      });
    });
  }

  if (payload.listPrescriptionOrder && payload.listPrescriptionOrder.length > 0) {
    payload.listPrescriptionOrder.forEach((item, index) => {
      Object.entries(item).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(`listPrescriptionOrder[${index}].${key}`, String(value));
        }
      });
    });
  }

  appendFiles(formData, 'listImageXray', payload.listImageXray);
  appendFiles(formData, 'listImageFace', payload.listImageFace);
  appendFiles(formData, 'listImageTeeth', payload.listImageTeeth);
  appendStrings(formData, 'listDeleteImageByPublicId', payload.listDeleteImageByPublicId);

  return formData;
};

export const doctorAPI = {
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/api/v1/users/myInfo');
    return unwrap<UserProfile>(response.data);
  },

  getDoctorDirectory: async (): Promise<DoctorSummary[]> => {
    try {
      const response = await apiClient.get('/api/v1/doctor/doctors');
      return unwrap<DoctorSummary[]>(response.data);
    } catch (error: any) {
      // If 401/403, user might not have permission - return empty array
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return [];
      }
      // Re-throw other errors
      throw error;
    }
  },

  getExaminationsByDoctorId: async (doctorId: string): Promise<ExaminationSummary[]> => {
    const response = await apiClient.get(`/api/v1/doctor/${doctorId}/examinations`);
    return unwrap<ExaminationSummary[]>(response.data);
  },

  getTreatmentPlansByDoctorId: async (doctorId: string): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get(`/api/v1/doctor/${doctorId}/treatmentPlans`);
    return unwrap<TreatmentPlan[]>(response.data);
  },

  getMyAppointments: async (filter: AppointmentFilter = 'all'): Promise<AppointmentSummary[]> => {
    const endpoint =
      filter === 'scheduled'
        ? '/api/v1/doctor/myAppointment/scheduled'
        : '/api/v1/doctor/myAppointment';
    const response = await apiClient.get(endpoint);
    
    // Handle case where response.data is a string (JSON string)
    let data = response.data;
    if (typeof data === 'string') {
      try {
        // Try to extract the first valid JSON object if there are multiple
        const trimmed = data.trim();
        let jsonString = trimmed;
        
        // If the string contains multiple JSON objects, try to extract the first one
        if (trimmed.startsWith('{')) {
          // Find the matching closing brace
          let braceCount = 0;
          let endIndex = -1;
          for (let i = 0; i < trimmed.length; i++) {
            if (trimmed[i] === '{') braceCount++;
            if (trimmed[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                endIndex = i + 1;
                break;
              }
            }
          }
          if (endIndex > 0) {
            jsonString = trimmed.substring(0, endIndex);
          }
        } else if (trimmed.startsWith('[')) {
          // Find the matching closing bracket
          let bracketCount = 0;
          let endIndex = -1;
          for (let i = 0; i < trimmed.length; i++) {
            if (trimmed[i] === '[') bracketCount++;
            if (trimmed[i] === ']') {
              bracketCount--;
              if (bracketCount === 0) {
                endIndex = i + 1;
                break;
              }
            }
          }
          if (endIndex > 0) {
            jsonString = trimmed.substring(0, endIndex);
          }
        }
        
        data = JSON.parse(jsonString);
      } catch (e) {
        // If it's already an object (axios might have parsed it), use it directly
        if (typeof response.data === 'object' && response.data !== null) {
          data = response.data;
        } else {
          return [];
        }
      }
    }
    
    const unwrapped = unwrap<AppointmentSummary[]>(data);
    return unwrapped;
  },

  getAppointmentsByDoctor: async (
    doctorId: string,
    filter: AppointmentFilter = 'all',
  ): Promise<AppointmentSummary[]> => {
    const endpoint =
      filter === 'scheduled'
        ? `/api/v1/doctor/appointment/scheduled/${doctorId}`
        : `/api/v1/doctor/appointment/${doctorId}`;
    const response = await apiClient.get(endpoint);
    return unwrap<AppointmentSummary[]>(response.data);
  },

  getMyExaminations: async (): Promise<ExaminationSummary[]> => {
    const response = await apiClient.get('/api/v1/doctor/myExamination');
    return unwrap<ExaminationSummary[]>(response.data);
  },

  getExaminationDetail: async (examinationId: string): Promise<ExaminationSummary> => {
    const response = await apiClient.get(`/api/v1/doctor/examination/${examinationId}`);
    return unwrap<ExaminationSummary>(response.data);
  },

  getExaminationByAppointment: async (appointmentId: string): Promise<ExaminationSummary | null> => {
    try {
      const response = await apiClient.get(`/api/v1/doctor/${appointmentId}/examination`);
      return unwrap<ExaminationSummary>(response.data);
    } catch (error: any) {
      // Nếu appointment chưa có examination (404 hoặc 400), trả về null
      if (error.response?.status === 404 || error.response?.status === 400) {
        return null;
      }
      throw error;
    }
  },

  createExamination: async (appointmentId: string, payload: ExaminationRequestPayload) => {
    const formData = buildExaminationFormData(payload);
    const response = await apiClient.post(`/api/v1/doctor/${appointmentId}/examination`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<ExaminationSummary>(response.data);
  },

  updateExamination: async (examinationId: string, payload: ExaminationUpdatePayload) => {
    const formData = buildExaminationFormData(payload);
    const response = await apiClient.put(`/api/v1/doctor/examination/${examinationId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<ExaminationSummary>(response.data);
  },

  getMyTreatmentPlans: async (): Promise<TreatmentPlan[]> => {
    try {
      const response = await apiClient.get('/api/v1/doctor/myTreatmentPlans');
      return unwrap<TreatmentPlan[]>(response.data);
    } catch (error: any) {
      // Trả về empty array thay vì throw error để app không crash
      // Component có thể handle empty array và vẫn hiển thị patients từ examinations
      return [];
    }
  },

  getAllTreatmentPlans: async (): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get('/api/v1/doctor/treatmentPlans');
    return unwrap<TreatmentPlan[]>(response.data);
  },

  createTreatmentPlan: async (payload: TreatmentPlanPayload): Promise<TreatmentPlan> => {
    // Build request payload matching backend TreatmentPlansRequest
    // Backend expects: title, description, duration, notes, examinationId, nurseId (optional), doctorId (optional)
    const requestPayload: any = {
      title: payload.title || '',
      description: payload.description || '',
      duration: payload.duration || '',
      notes: payload.notes || '',
      examinationId: payload.examinationId,
    };
    
    // Only include nurseId if it's provided and not empty
    if (payload.nurseId && payload.nurseId.trim() !== '') {
      requestPayload.nurseId = payload.nurseId;
    }
    
    // Only include doctorId if it's provided and not empty (for DOCTORLV2 with PICK_DOCTOR permission)
    if (payload.doctorId && payload.doctorId.trim() !== '') {
      requestPayload.doctorId = payload.doctorId;
    }
    
    try {
      const response = await apiClient.post('/api/v1/doctor/treatmentPlans', requestPayload);
      return unwrap<TreatmentPlan>(response.data);
    } catch (error: any) {
      throw error;
    }
  },

  updateTreatmentPlan: async (
    treatmentPlanId: string,
    payload: TreatmentPlanUpdatePayload,
  ): Promise<TreatmentPlan> => {
    const response = await apiClient.put(
      `/api/v1/doctor/treatmentPlans/${treatmentPlanId}`,
      payload,
    );
    return unwrap<TreatmentPlan>(response.data);
  },

  getTreatmentPhases: async (treatmentPlanId: string): Promise<TreatmentPhase[]> => {
    const response = await apiClient.get(`/api/v1/doctor/treatmentPhases/${treatmentPlanId}`);
    return unwrap<TreatmentPhase[]>(response.data);
  },

  createTreatmentPhase: async (
    treatmentPlanId: string,
    payload: TreatmentPhasePayload,
  ): Promise<TreatmentPhase> => {
    const formData = buildPhaseFormData(payload);
    const response = await apiClient.post(
      `/api/v1/doctor/${treatmentPlanId}/treatmentPhases`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap<TreatmentPhase>(response.data);
  },

  updateTreatmentPhase: async (
    treatmentPhaseId: string,
    payload: TreatmentPhasePayload,
  ): Promise<TreatmentPhase> => {
    const formData = buildPhaseFormData(payload);
    const response = await apiClient.put(
      `/api/v1/doctor/treatmentPhases/${treatmentPhaseId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrap<TreatmentPhase>(response.data);
  },

  getDentalCategories: async (): Promise<{ id: string; name: string; listDentalServiceEntity: DentalService[] }[]> => {
    const response = await apiClient.get('/api/v1/categoryDentalService');
    return unwrap(response.data);
  },

  getDentalServices: async (): Promise<DentalService[]> => {
    const response = await apiClient.get('/api/v1/dentalService');
    return unwrap<DentalService[]>(response.data);
  },

  getPrescriptionCatalog: async (): Promise<PrescriptionItem[]> => {
    const response = await apiClient.get('/api/v1/prescription');
    return unwrap<PrescriptionItem[]>(response.data);
  },

  // DOCTOR LV2 APIs - Comment on examinations and treatment phases
  /**
   * Add comment to examination (Doctor LV2 only)
   * @param examinationId - Examination ID
   * @param comment - Comment text
   * @returns Updated examination with comment
   */
  commentExamination: async (examinationId: string, comment: string): Promise<ExaminationSummary> => {
    const response = await apiClient.post(`/api/v1/doctor/commentExamination/${examinationId}`, { comment });
    return unwrap<ExaminationSummary>(response.data);
  },

  /**
   * Add comment to treatment phase (Doctor LV2 only)
   * NOTE: Backend has a bug - path variable is {examinationId} but should be {treatmentPhasesId}
   * @param treatmentPhasesId - Treatment phase ID
   * @param comment - Comment text
   * @returns Updated treatment phase with comment
   */
  commentTreatmentPhase: async (treatmentPhasesId: string, comment: string): Promise<TreatmentPhase> => {
    // NOTE: Backend bug - path uses {examinationId} but parameter is treatmentPhasesId
    // Using treatmentPhasesId in path as it should be
    const response = await apiClient.post(`/api/v1/doctor/commentTreatmentPhases/${treatmentPhasesId}`, { comment });
    return unwrap<TreatmentPhase>(response.data);
  },

  /**
   * Get all costs for the current doctor
   * This calculates revenue from examinations and treatment phases that have been paid
   * Note: Costs are created from examinations and treatment phases, so we need to fetch them
   * to check payment status. Since there's no direct API, we'll calculate from available data.
   * In production, you might want to create a dedicated endpoint for this.
   */
  getMyRevenue: async (): Promise<number> => {
    // This is a helper function that calculates revenue
    // In a real scenario, you'd want a backend endpoint that returns costs filtered by doctor and status
    // For now, we'll return 0 and calculate on the frontend from examinations and treatment phases
    // The actual calculation should check Cost.status = "paid" or "Done"
    return 0;
  },
};

