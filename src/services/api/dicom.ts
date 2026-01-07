import apiClient from './client';

export interface DicomStudyResponse {
  id: string;
  patientId: string;
  patientName?: string;
  examinationId?: string;
  treatmentPhaseId?: string;
  orthancStudyId: string;
  studyInstanceUID: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  accessionNumber?: string;
  modality?: string;
  referringPhysicianName?: string;
  patientIdDicom?: string;
  patientBirthDate?: string;
  patientSex?: string;
  numberOfStudyRelatedSeries?: number;
  numberOfStudyRelatedInstances?: number;
  series?: DicomSeriesResponse[];
}

export interface DicomSeriesResponse {
  id: string;
  studyId: string;
  orthancSeriesId: string;
  seriesInstanceUID: string;
  seriesNumber?: number;
  seriesDescription?: string;
  seriesDate?: string;
  seriesTime?: string;
  modality?: string;
  bodyPartExamined?: string;
  protocolName?: string;
  numberOfSeriesRelatedInstances?: number;
  instances?: DicomInstanceResponse[];
}

export interface DicomInstanceResponse {
  id: string;
  seriesId: string;
  orthancInstanceId: string;
  sopInstanceUID: string;
  sopClassUID?: string;
  instanceNumber?: number;
  contentDate?: string;
  contentTime?: string;
  imageType?: string;
  rows?: number;
  columns?: number;
  bitsAllocated?: number;
  bitsStored?: number;
  samplesPerPixel?: number;
  photometricInterpretation?: string;
  fileSize?: number;
  filePath?: string;
}

export const dicomAPI = {
  /**
   * Upload DICOM file
   */
  uploadDicom: async (
    file: File,
    patientId: string,
    examinationId?: string,
    treatmentPhaseId?: string
  ): Promise<DicomStudyResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    if (examinationId) formData.append('examinationId', examinationId);
    if (treatmentPhaseId) formData.append('treatmentPhaseId', treatmentPhaseId);

    // For FormData, axios will automatically set Content-Type with boundary
    // The interceptor will remove default Content-Type header
    const response = await apiClient.post<{ code: number; result: DicomStudyResponse }>(
      '/api/v1/dicom/upload',
      formData
    );
    return response.data.result;
  },

  /**
   * Get DICOM study by ID
   */
  getStudyById: async (studyId: string): Promise<DicomStudyResponse> => {
    const response = await apiClient.get<{ code: number; result: DicomStudyResponse }>(
      `/api/v1/dicom/studies/${studyId}`
    );
    return response.data.result;
  },

  /**
   * Get all DICOM studies for a patient
   */
  getStudiesByPatientId: async (patientId: string): Promise<DicomStudyResponse[]> => {
    const response = await apiClient.get<{ code: number; result: DicomStudyResponse[] }>(
      `/api/v1/dicom/patients/${patientId}/studies`
    );
    return response.data.result;
  },

  /**
   * Get DICOM studies for an examination
   */
  getStudiesByExaminationId: async (examinationId: string): Promise<DicomStudyResponse[]> => {
    const response = await apiClient.get<{ code: number; result: DicomStudyResponse[] }>(
      `/api/v1/dicom/examinations/${examinationId}/studies`
    );
    return response.data.result;
  },

  /**
   * Get DICOM studies for a treatment phase
   */
  getStudiesByTreatmentPhaseId: async (
    treatmentPhaseId: string
  ): Promise<DicomStudyResponse[]> => {
    const response = await apiClient.get<{ code: number; result: DicomStudyResponse[] }>(
      `/api/v1/dicom/treatment-phases/${treatmentPhaseId}/studies`
    );
    return response.data.result;
  },

  /**
   * Delete DICOM study
   */
  deleteStudy: async (studyId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/dicom/studies/${studyId}`);
  },

  /**
   * Get DICOM file from Orthanc (direct API call)
   * Note: This bypasses backend and calls Orthanc directly
   */
  getDicomFileFromOrthanc: async (instanceId: string): Promise<ArrayBuffer> => {
    // Orthanc runs on localhost:8042
    const orthancBaseUrl = 'http://localhost:8042';
    const response = await fetch(`${orthancBaseUrl}/instances/${instanceId}/file`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch DICOM file: ${response.statusText}`);
    }
    return response.arrayBuffer();
  },

  /**
   * Get DICOM file URL for Cornerstone.js
   * Returns a wadouri: URL that Cornerstone can use
   * Uses backend API to proxy DICOM files from Orthanc (avoids CORS issues)
   * Supports multi-frame DICOM: if instanceId contains "#frame=", frame index is passed as query param
   */
  getDicomImageUrl: (instanceId: string): string => {
    // Use backend API endpoint to proxy DICOM files from Orthanc
    // This avoids CORS issues when frontend tries to access Orthanc directly
    const backendBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    
    // Check if this is a multi-frame instance (format: orthancInstanceId#frame=index)
    let baseInstanceId = instanceId;
    let frameIndex: number | null = null;
    
    if (instanceId.includes('#frame=')) {
      const parts = instanceId.split('#frame=');
      baseInstanceId = parts[0];
      frameIndex = parseInt(parts[1], 10);
    }
    
    // Build URL with frame as query parameter (Spring doesn't parse # in path)
    // IMPORTANT: baseInstanceId should NOT contain #frame=, only the base ID
    let url = `${backendBaseUrl}/api/v1/dicom/instances/${encodeURIComponent(baseInstanceId)}/file`;
    if (frameIndex !== null && !isNaN(frameIndex)) {
      url += `?frame=${frameIndex}`;
    }
    
    // Cornerstone.js requires 'wadouri:' prefix for WADO-URI
    // For multi-frame, append frame index to wadouri URL (not query param)
    // Format: wadouri:url?frame=0#frame=0
    const wadouriUrl = frameIndex !== null ? `wadouri:${url}#frame=${frameIndex}` : `wadouri:${url}`;
    
    // No debug log to avoid console spam - remove if needed for debugging
    // if (import.meta.env.DEV && frameIndex !== null && frameIndex === 0) {
    //   console.log(`[DICOM] Multi-frame URL (first frame): baseInstanceId=${baseInstanceId}, frameIndex=${frameIndex}, url=${url}`);
    // }
    
    return wadouriUrl;
  },
};

