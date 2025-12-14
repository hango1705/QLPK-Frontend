import apiClient from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string; // phải là 'password'
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  verifiedCode: string;
  createAt: string;
}

export interface DoctorCreateRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  createAt: string;
  specialization: string;
  licenseNumber: string;
  yearsExperience: number;
  verifiedCode: string;
}

export interface NurseCreateRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  createAt: string;
  department: string;
  verifiedCode: string;
}

export interface AuthResponse {
  code: number;
  result: {
    authenticated: boolean;
    token: string;
    refreshToken?: string;
  };
}

export interface UserResponse {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  disable: boolean;
  role?: 'admin' | 'doctor' | 'nurse' | 'patient';
}

export interface VerificationResponse {
  message: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface TokenIntrospectResponse {
  code: number;
  result: {
    valid: boolean;
  };
}

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/api/v1/auth/login', credentials),
    
  // Bước 1: Gửi mã xác thực email
  sendVerificationCode: (email: string) =>
    apiClient.post<VerificationResponse>(`/api/v1/auth/verifiedCode/${email}`),
    
  // Bước 2: Hoàn tất đăng ký với mã xác thực
  register: (userData: RegisterData) =>
    apiClient.post<AuthResponse>('/api/v1/auth/register/patient', userData),
    
  logout: (token: string) =>
    apiClient.post('/api/v1/auth/logout', { token }),
    
  refreshToken: (refreshToken: string) =>
    apiClient.post<{ code: number; result: RefreshTokenResponse }>('/api/v1/auth/refresh', { refreshToken }),
    
  // NOTE: getCurrentUser endpoint does not exist in Backend
  // Use adminAPI.getMyInfo() or doctorAPI.getMyProfile() instead
  // getCurrentUser: (token: string) =>
  //   apiClient.get<UserResponse>('/api/v1/auth/me', {
  //     headers: { Authorization: `Bearer ${token}` }
  //   }),
    
  forgotPassword: (username: string) =>
    apiClient.post('/api/v1/auth/forgotPassword', { username }),
    
  verifyResetPassword: (id: string) =>
    apiClient.post(`/api/v1/auth/verifyResetPassword/${id}`),
    
  resetPassword: (id: string, newPassword: string) =>
    apiClient.post('/api/v1/auth/resetPassword', { id, newPassword }),
    
  // NOTE: verifyEmail endpoint does not exist in Backend
  // verifyEmail: (token: string) =>
  //   apiClient.post('/api/v1/auth/verify-email', { token }),
    
  // NOTE: resendVerification endpoint does not exist in Backend
  // resendVerification: (email: string) =>
  //   apiClient.post('/api/v1/auth/resend-verification', { email }),
    
  // Token Introspection API
  introspectToken: (token: string) =>
    apiClient.post<TokenIntrospectResponse>('/api/v1/auth/introspect', { token }),
  
  // Register Doctor (Admin only)
  registerDoctor: (userData: DoctorCreateRequest) =>
    apiClient.post<{ code: number; result: string }>('/api/v1/auth/register/doctor', userData),
  
  // Register Nurse (Admin only)
  registerNurse: (userData: NurseCreateRequest) =>
    apiClient.post<{ code: number; result: string }>('/api/v1/auth/register/nurse', userData),
};
