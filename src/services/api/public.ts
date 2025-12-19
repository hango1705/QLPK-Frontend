import axios from 'axios';
import type { CategoryDentalService, DentalService } from '@/types/admin';
import type { DoctorSummary } from '@/types/doctor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Public API client (no authentication required)
const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const unwrap = <T,>(response: any): T => {
  if (response?.data?.result !== undefined) {
    return response.data.result;
  }
  return response.data;
};

export const publicAPI = {
  // Get all categories with their services
  getAllCategories: async (): Promise<CategoryDentalService[]> => {
    try {
      const response = await publicApiClient.get('/api/v1/categoryDentalService');
      return unwrap<CategoryDentalService[]>(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get services by category ID
  getServicesByCategory: async (categoryId: string): Promise<DentalService[]> => {
    try {
      const response = await publicApiClient.get(`/api/v1/dentalService?categoryId=${categoryId}`);
      return unwrap<DentalService[]>(response);
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Get all doctors (DOCTOR and DOCTORLV2 roles)
  getAllDoctors: async (): Promise<DoctorSummary[]> => {
    try {
      const response = await publicApiClient.get('/api/v1/doctor/doctors');
      return unwrap<DoctorSummary[]>(response);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },
};

