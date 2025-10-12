import apiClient from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
}

export interface AuthResponse {
  token: string;
  message?: string;
}

export interface VerificationResponse {
  message: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/api/v1/auth/login', credentials),
    
  register: (userData: RegisterData) =>
    apiClient.post<AuthResponse>('/api/v1/auth/register/patient', userData),
    
  sendVerificationCode: (email: string) =>
    apiClient.post<VerificationResponse>(`/api/v1/auth/verifiedCode/${email}`),
    
  logout: (token: string) =>
    apiClient.post('/auth/logout', { token }),
    
  refreshToken: (refreshToken: string) =>
    apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken }),
    
  getCurrentUser: (token: string) =>
    apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),
    
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
    
  verifyEmail: (token: string) =>
    apiClient.post('/auth/verify-email', { token }),
    
  resendVerification: (email: string) =>
    apiClient.post('/auth/resend-verification', { email }),
};
