import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { refreshToken, clearCredentials } from '@/store/slices/authSlice';

// Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const resultAction = await store.dispatch(refreshToken());
        
        if (refreshToken.fulfilled.match(resultAction)) {
          // Retry original request with new token
          const state = store.getState();
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${state.auth.token}`;
          }
          return apiClient(originalRequest);
        } else {
          // Refresh failed, logout user
          store.dispatch(clearCredentials());
          console.log('Token refresh failed, user logged out');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(clearCredentials());
        console.log('Token refresh error, user logged out');
        return Promise.reject(refreshError);
      }
    }
    
    // Log error responses
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle other errors
    if (error.response?.status === 403) {
      // Forbidden - redirect to appropriate page
      console.error('Access forbidden');
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Error handling utility
export const handleApiError = (error: AxiosError): string => {
  if (error.response) {
    // Server responded with error status
    const data = error.response.data as any;
    const message = data?.message || data?.error;
    if (message) {
      return message;
    }
    
    switch (error.response.status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized. Please login again.';
      case 403:
        return 'Access forbidden. You do not have permission.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict. Resource already exists.';
      case 422:
        return 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Bad gateway. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};

export default apiClient;
