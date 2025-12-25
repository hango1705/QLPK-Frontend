// API client
export { default as apiClient, handleApiError } from './api/client';

// Query client
export { queryClient, queryKeys } from './queryClient';

// API services
export { authAPI } from './api/auth';
export { userAPI } from './api/user';
export { doctorAPI } from './api/doctor';
export { adminAPI } from './api/admin';
export { nurseAPI } from './api/nurse';
export { patientAPI } from './api/patient';
export { dicomAPI } from './api/dicom';
export type {
  DicomStudyResponse,
  DicomSeriesResponse,
  DicomInstanceResponse,
} from './api/dicom';
