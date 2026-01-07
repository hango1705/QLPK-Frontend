import apiClient from './client';
import { store } from '@/store';

export interface AiDetection {
  id: string;
  classId: number;
  className: string;
  confidence: number;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export interface AiAnalysisResponse {
  id: string;
  dicomInstanceId?: string;
  imageId?: string;
  confidenceThreshold: number;
  totalDetections: number;
  imageWidth: number;
  imageHeight: number;
  analysisStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  detections: AiDetection[];
}

export const aiAPI = {
  /**
   * Analyze image file
   */
  analyzeImage: async (
    file: File,
    options?: {
      dicomInstanceId?: string;
      imageId?: string;
      confidence?: number;
    }
  ): Promise<AiAnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.dicomInstanceId) {
      formData.append('dicomInstanceId', options.dicomInstanceId);
    }
    if (options?.imageId) {
      formData.append('imageId', options.imageId);
    }
    if (options?.confidence !== undefined) {
      formData.append('confidence', options.confidence.toString());
    }

    // Use XMLHttpRequest for FormData to ensure proper Content-Type with boundary
    // XMLHttpRequest handles FormData natively and automatically sets multipart/form-data with boundary
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:8080';
    const state = store.getState();
    const token = state.auth.token;
    
    return new Promise<AiAnalysisResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${baseURL}/api/v1/ai/analyze`, true);
      
      // Set auth header if token exists
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Set Accept header for JSON response
      xhr.setRequestHeader('Accept', 'application/json');
      
      // Don't set Content-Type - browser will automatically set multipart/form-data with boundary
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.code === 1000 && response.result) {
              resolve(response.result);
            } else {
              reject(new Error(response.message || 'Request failed'));
            }
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || `Request failed with status ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Request failed with status ${xhr.status}`));
          }
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error'));
      };
      
      xhr.send(formData);
    });
  },

  /**
   * Analyze DICOM instance
   */
  analyzeDicomInstance: async (
    dicomInstanceId: string,
    confidence?: number
  ): Promise<AiAnalysisResponse> => {
    const params = new URLSearchParams();
    if (confidence !== undefined) {
      params.append('confidence', confidence.toString());
    }

    const response = await apiClient.post<{ code: number; result: AiAnalysisResponse }>(
      `/api/v1/ai/dicom-instances/${dicomInstanceId}/analyze${params.toString() ? '?' + params.toString() : ''}`
    );
    return response.data.result;
  },

  /**
   * Analyze image by ID
   */
  analyzeImageById: async (
    imageId: string,
    confidence?: number
  ): Promise<AiAnalysisResponse> => {
    const params = new URLSearchParams();
    if (confidence !== undefined) {
      params.append('confidence', confidence.toString());
    }

    const response = await apiClient.post<{ code: number; result: AiAnalysisResponse }>(
      `/api/v1/ai/images/${imageId}/analyze${params.toString() ? '?' + params.toString() : ''}`
    );
    return response.data.result;
  },

  /**
   * Get analysis by ID
   */
  getAnalysisById: async (analysisId: string): Promise<AiAnalysisResponse> => {
    const response = await apiClient.get<{ code: number; result: AiAnalysisResponse }>(
      `/api/v1/ai/analyses/${analysisId}`
    );
    return response.data.result;
  },

  /**
   * Get analyses for DICOM instance
   */
  getAnalysesByDicomInstanceId: async (
    dicomInstanceId: string
  ): Promise<AiAnalysisResponse[]> => {
    const response = await apiClient.get<{ code: number; result: AiAnalysisResponse[] }>(
      `/api/v1/ai/dicom-instances/${dicomInstanceId}/analyses`
    );
    return response.data.result;
  },

  /**
   * Get analyses for image
   */
  getAnalysesByImageId: async (imageId: string): Promise<AiAnalysisResponse[]> => {
    const response = await apiClient.get<{ code: number; result: AiAnalysisResponse[] }>(
      `/api/v1/ai/images/${imageId}/analyses`
    );
    return response.data.result;
  },
};

