import apiClient from './client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: 'admin' | 'doctor' | 'patient';
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const userAPI = {
  getProfile: (userId: string) =>
    apiClient.get<UserProfile>(`/users/${userId}`),
    
  updateProfile: (userId: string, profileData: UpdateProfileData) =>
    apiClient.put<UserProfile>(`/users/${userId}`, profileData),
    
  uploadAvatar: (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post<{ avatar: string }>(`/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  changePassword: (userId: string, passwordData: ChangePasswordData) =>
    apiClient.post(`/users/${userId}/change-password`, passwordData),
    
  deleteAccount: (userId: string, password: string) =>
    apiClient.delete(`/users/${userId}`, {
      data: { password }
    }),
    
  getAppointments: (userId: string, params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    date?: string;
  }) =>
    apiClient.get(`/users/${userId}/appointments`, { params }),
    
  getMedicalRecords: (userId: string, params?: { 
    page?: number; 
    limit?: number; 
    type?: string;
  }) =>
    apiClient.get(`/users/${userId}/medical-records`, { params }),
};
