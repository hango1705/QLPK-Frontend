import apiClient from './client';
import type { ApiEnvelope } from '@/types/doctor';

type ApiPayload<T> = ApiEnvelope<T> | T;

const unwrap = <T>(payload: ApiPayload<T>): T => {
  if (!payload) {
    return payload as T;
  }
  
  // Handle case where payload is a JSON string
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return unwrap<T>(parsed);
    } catch (e) {
      return payload as T;
    }
  }
  
  // Handle ApiEnvelope format: { code: number, result: T }
  if (typeof payload === 'object' && 'result' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    const result = envelope.result;
    
    if (result === undefined || result === null) {
      return payload as T;
    }
    
    return result;
  }
  
  // If payload is already the expected type
  return payload as T;
};

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  gender?: string;
  dob?: string; // Date in format YYYY-MM-DD
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  gender?: string;
  dob?: string; // Date in format YYYY-MM-DD
}

export interface ChangePasswordData {
  oldPassword: string;
  password: string;
}

export const userAPI = {
  getMyInfo: async (): Promise<UserResponse> => {
    const response = await apiClient.get('/api/v1/users/myInfo');
    return unwrap<UserResponse>(response.data);
  },
    
  getProfile: async (userId: string): Promise<UserResponse> => {
    const response = await apiClient.get(`/api/v1/users/${userId}`);
    return unwrap<UserResponse>(response.data);
  },
    
  updateProfile: async (userId: string, profileData: UpdateProfileData): Promise<UserResponse> => {
    const response = await apiClient.put(`/api/v1/users/updateInfo/${userId}`, profileData);
    return unwrap<UserResponse>(response.data);
  },
  
  changePassword: async (userId: string, passwordData: ChangePasswordData): Promise<string> => {
    const response = await apiClient.put(`/api/v1/users/updatePassword/${userId}`, passwordData);
    return unwrap<string>(response.data);
  },
};
