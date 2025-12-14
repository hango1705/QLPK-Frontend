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

// Store pending requests to cancel them on logout
const pendingRequests = new Set<AbortController>();

// Track logout in progress to prevent duplicate logout requests
let isLoggingOut = false;
const logoutTokens = new Set<string>();

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

// Function to check if logout is in progress
export const isLogoutInProgress = () => isLoggingOut;

// Function to cancel all pending requests (called on logout)
export const cancelAllPendingRequests = () => {
  pendingRequests.forEach((controller) => {
    controller.abort();
  });
  pendingRequests.clear();
  // Clear failed queue
  processQueue(new Error('Request cancelled due to logout'));
  isRefreshing = false;
  isLoggingOut = true;
};

// Function to reset logout state (called after logout completes)
export const resetLogoutState = () => {
  isLoggingOut = false;
  logoutTokens.clear();
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;
    
    // Check if this is a logout request
    const isLogoutRequest = config.url?.includes('/auth/logout');
    const isLoginRequest = config.url?.includes('/auth/login');
    const isRegisterRequest = config.url?.includes('/auth/register');
    
    // If we're logging out, reject all requests except logout/login/register
    if (isLoggingOut && !isLogoutRequest && !isLoginRequest && !isRegisterRequest) {
      return Promise.reject(new Error('Logout in progress, request cancelled'));
    }
    
    // For logout requests, don't add Authorization header and skip token refresh
    // Backend will validate token from request body, not from header
    if (isLogoutRequest) {
      // Check if we're already logging out with this token
      const requestBody = config.data;
      let tokenToLogout: string | null = null;
      
      // Try to extract token from request body
      if (typeof requestBody === 'string') {
        try {
          const parsed = JSON.parse(requestBody);
          tokenToLogout = parsed.token;
        } catch (e) {
          // Not JSON, ignore
        }
      } else if (requestBody && typeof requestBody === 'object' && 'token' in requestBody) {
        tokenToLogout = (requestBody as any).token;
      }
      
      // If this token is already being logged out, reject the request
      if (tokenToLogout && logoutTokens.has(tokenToLogout)) {
        return Promise.reject(new Error('Logout request already in progress for this token'));
      }
      
      // Mark this token as being logged out
      if (tokenToLogout) {
        logoutTokens.add(tokenToLogout);
      }
      
      // Remove Authorization header if it exists
      if (config.headers) {
        delete config.headers.Authorization;
      }
      
      // Cancel all pending requests when logout starts
      if (!isLoggingOut) {
        cancelAllPendingRequests();
      }
      
      return config;
    }
    
    // Check if user is logged out (no token) - cancel request
    // But allow logout/login/register requests to proceed even without token in state
    if (!token && !isLoginRequest && !isRegisterRequest && !isLogoutRequest) {
      const abortController = new AbortController();
      abortController.abort();
      config.signal = abortController.signal;
      return Promise.reject(new Error('User logged out'));
    }
    
    // Add abort controller for pending requests tracking
    if (!config.signal) {
      const abortController = new AbortController();
      config.signal = abortController.signal;
      pendingRequests.add(abortController);
      
      // Remove from set when request completes
      const originalSignal = abortController.signal;
      originalSignal.addEventListener('abort', () => {
        pendingRequests.delete(abortController);
      });
    }
    
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
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle case where response.data is a JSON string instead of parsed object
    if (typeof response.data === 'string') {
      try {
        const contentType = response.headers['content-type'] || '';
        // Only parse if it looks like JSON
        if (contentType.includes('application/json') || 
            (response.data.trim().startsWith('{') || response.data.trim().startsWith('['))) {
          // Try to extract the first valid JSON object if there are multiple
          const trimmed = response.data.trim();
          let jsonString = trimmed;
          
          // If the string contains multiple JSON objects, try to extract the first one
          if (trimmed.startsWith('{')) {
            // Find the matching closing brace
            let braceCount = 0;
            let endIndex = -1;
            for (let i = 0; i < trimmed.length; i++) {
              if (trimmed[i] === '{') braceCount++;
              if (trimmed[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  endIndex = i + 1;
                  break;
                }
              }
            }
            if (endIndex > 0) {
              jsonString = trimmed.substring(0, endIndex);
            }
          } else if (trimmed.startsWith('[')) {
            // Find the matching closing bracket
            let bracketCount = 0;
            let endIndex = -1;
            for (let i = 0; i < trimmed.length; i++) {
              if (trimmed[i] === '[') bracketCount++;
              if (trimmed[i] === ']') {
                bracketCount--;
                if (bracketCount === 0) {
                  endIndex = i + 1;
                  break;
                }
              }
            }
            if (endIndex > 0) {
              jsonString = trimmed.substring(0, endIndex);
            }
          }
          
          response.data = JSON.parse(jsonString);
        }
      } catch (e) {
        // If parsing fails, try to return the response as-is (axios might have already parsed it)
        // Don't throw error, let the calling code handle it
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if this is a logout request FIRST
    const isLogoutRequest = originalRequest?.url?.includes('/auth/logout');

    // Remove from pending requests (with null check)
    if (originalRequest && originalRequest.signal && originalRequest.signal instanceof AbortController) {
      pendingRequests.delete(originalRequest.signal);
    }
    
    // Handle logout requests specially - do this BEFORE any other error handling
    if (isLogoutRequest) {
      // Extract token from request body to remove from tracking
      const requestBody = originalRequest.data;
      let tokenToLogout: string | null = null;
      
      if (typeof requestBody === 'string') {
        try {
          const parsed = JSON.parse(requestBody);
          tokenToLogout = parsed.token;
        } catch (e) {
          // Not JSON, ignore
        }
      } else if (requestBody && typeof requestBody === 'object' && 'token' in requestBody) {
        tokenToLogout = (requestBody as any).token;
      }
      
      // Remove token from tracking
      if (tokenToLogout) {
        logoutTokens.delete(tokenToLogout);
      }
      
      // For logout requests, suppress 400 (duplicate) and 401 (already invalidated) errors
      // These are expected behaviors
      if (error.response?.status === 400 || error.response?.status === 401) {
        // Suppress error completely - these are expected
        return Promise.resolve({
          data: { code: 1000, result: null },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: originalRequest,
        } as AxiosResponse);
      }
      
      // For other errors, reject normally
      return Promise.reject(error);
    }
    
    // Don't retry on 400 Bad Request errors (client errors) for non-logout requests
    if (error.response?.status === 400) {
      return Promise.reject(error);
    }
    
    // Check if user is logged out (no token in state)
    const state = store.getState();
    if (!state.auth.token) {
      // User is logged out, don't retry any requests
      return Promise.reject(error);
    }
    
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
        
        // If user is logged out (no token), don't retry
        if (!currentToken) {
          isRefreshing = false;
          processQueue(new Error('User logged out'));
          return Promise.reject(error);
        }
        
        // Check if we have refresh token
        if (!refreshTokenValue) {
          // If we have a token but no refreshToken, check if token is still valid
          // Don't immediately logout - the 401 might be due to other reasons
          if (currentToken) {
            try {
              // Try to introspect the current token
              const introspectResponse = await authAPI.introspectToken(currentToken);
              const isValid = introspectResponse.data?.code === 1000 && introspectResponse.data?.result?.valid;
              
              if (isValid) {
                // Token is still valid, retry the request with current token
                if (originalRequest.headers && currentToken) {
                  originalRequest.headers.Authorization = `Bearer ${currentToken}`;
                }
                isRefreshing = false;
                return apiClient(originalRequest);
              }
            } catch (introspectError) {
              // Introspect failed, token might be invalid
            }
          }
          
          // No refresh token and token is invalid or missing, logout
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
          store.dispatch(clearCredentials());
          isRefreshing = false;
          processQueue(new Error('Token refresh failed'));
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(clearCredentials());
        isRefreshing = false;
        processQueue(refreshError);
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    if (error.response?.status === 403) {
      // Forbidden - redirect to appropriate page
    } else if (error.response?.status >= 500) {
      // Server error
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
