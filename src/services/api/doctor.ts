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
  if (payload && typeof payload === 'object' && 'result' in payload) {
    return ((payload as ApiEnvelope<T>).result ?? (payload as T)) as T;
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
}

export interface TreatmentPlanUpdatePayload {
  title: string;
  description: string;
  duration: string;
  notes: string;
  status: string;
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
  formData.append('endDate', payload.endDate ?? '');
  formData.append('cost', String(payload.cost ?? 0));
  if (payload.status) {
    formData.append('status', payload.status);
  }
  if (payload.nextAppointment) {
    formData.append('nextAppointment', payload.nextAppointment);
  }

  appendCollection(formData, 'listDentalServicesEntityOrder', payload.listDentalServicesEntityOrder);
  appendCollection(formData, 'listPrescriptionOrder', payload.listPrescriptionOrder);

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
    const response = await apiClient.get('/api/v1/doctor/doctors');
    return unwrap<DoctorSummary[]>(response.data);
  },

  getMyAppointments: async (filter: AppointmentFilter = 'all'): Promise<AppointmentSummary[]> => {
    const endpoint =
      filter === 'scheduled'
        ? '/api/v1/doctor/myAppointment/scheduled'
        : '/api/v1/doctor/myAppointment';
    const response = await apiClient.get(endpoint);
    return unwrap<AppointmentSummary[]>(response.data);
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

  getExaminationByAppointment: async (appointmentId: string): Promise<ExaminationSummary> => {
    const response = await apiClient.get(`/api/v1/doctor/${appointmentId}/examination`);
    return unwrap<ExaminationSummary>(response.data);
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
    const response = await apiClient.get('/api/v1/doctor/myTreatmentPlans');
    return unwrap<TreatmentPlan[]>(response.data);
  },

  getAllTreatmentPlans: async (): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get('/api/v1/doctor/treatmentPlans');
    return unwrap<TreatmentPlan[]>(response.data);
  },

  createTreatmentPlan: async (payload: TreatmentPlanPayload): Promise<TreatmentPlan> => {
    const response = await apiClient.post('/api/v1/doctor/treatmentPlans', payload);
    return unwrap<TreatmentPlan>(response.data);
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
};

