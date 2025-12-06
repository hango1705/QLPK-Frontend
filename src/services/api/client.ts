import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { refreshToken, clearCredentials } from '@/store/slices/authSlice';
import { authAPI } from './auth';
import { isTokenExpired } from '@/utils/auth';

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

// Track if refresh is in progress to prevent race conditions
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;
    
    // Proactive token refresh: Check if token is expired or about to expire
    if (token && isTokenExpired(token)) {
      // Token is expired, try to refresh before making the request
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const resultAction = await store.dispatch(refreshToken());
          if (refreshToken.fulfilled.match(resultAction)) {
            const newState = store.getState();
            if (config.headers && newState.auth.token) {
              config.headers.Authorization = `Bearer ${newState.auth.token}`;
            }
            isRefreshing = false;
            processQueue(null, newState.auth.token);
            return config;
          } else {
            // Refresh failed
            isRefreshing = false;
            store.dispatch(clearCredentials());
            processQueue(new Error('Token refresh failed'));
            return Promise.reject(new Error('Token refresh failed'));
          }
        } catch (error) {
          isRefreshing = false;
          store.dispatch(clearCredentials());
          processQueue(error);
          return Promise.reject(error);
        }
      } else {
        // Refresh is in progress, wait for it to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (config.headers && newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          return config;
        });
      }
    }
    
    // Add token to request if available
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
    
    // Don't retry on 400 Bad Request errors (client errors)
    if (error.response?.status === 400) {
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // If refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (originalRequest.headers && token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }
      
      isRefreshing = true;
      
      try {
        const state = store.getState();
        const currentToken = state.auth.token;
        const refreshTokenValue = state.auth.refreshToken;
        
        // Check if we have refresh token
        if (!refreshTokenValue) {
          console.log('No refresh token available, logging out user');
              store.dispatch(clearCredentials());
          isRefreshing = false;
          processQueue(new Error('No refresh token'));
              return Promise.reject(error);
        }
        
        // Try to refresh token
        const resultAction = await store.dispatch(refreshToken());
        
        if (refreshToken.fulfilled.match(resultAction)) {
          // Refresh successful
          const newState = store.getState();
          const newToken = newState.auth.token;
          
          // Update authorization header
          if (originalRequest.headers && newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          isRefreshing = false;
          processQueue(null, newToken);
          
          // Retry original request with new token
          return apiClient(originalRequest);
        } else {
          // Refresh failed, logout user
          console.log('Token refresh failed, user logged out');
          store.dispatch(clearCredentials());
          isRefreshing = false;
          processQueue(new Error('Token refresh failed'));
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        console.log('Token refresh error, user logged out:', refreshError);
        store.dispatch(clearCredentials());
        isRefreshing = false;
        processQueue(refreshError);
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
