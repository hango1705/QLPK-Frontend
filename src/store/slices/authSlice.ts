import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '@/services/api/auth';
import { decodeTokenPayload, extractRoleFromToken, isTokenExpired } from '@/utils/auth';
import { tokenStorage } from '@/utils/tokenStorage';
import { queryClient } from '@/services/queryClient';
import { resetLogoutState } from '@/services/api/client';

export interface User {
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

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string; rememberMe?: boolean }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Xử lý response theo format API documentation
      if (response.data.code === 1000 && response.data.result.authenticated) {
        const token = response.data.result.token;
        const refreshToken = response.data.result.refreshToken || null;
        const rememberMe = credentials.rememberMe ?? false;
        
        // Lưu token vào storage dựa trên rememberMe flag
        tokenStorage.saveToken(token, refreshToken, rememberMe);
        
        return {
          token,
          refreshToken,
          authenticated: response.data.result.authenticated,
          rememberMe,
        };
      } else {
        throw new Error('Login failed: Invalid response format');
      }
    } catch (error: any) {
      // Xử lý lỗi một cách thân thiện, không hiển thị lỗi kỹ thuật cho end user
      if (error.response) {
        // Server trả về lỗi
        const status = error.response.status;
        const serverMessage = error.response?.data?.message;
        
        // Nếu server có message thân thiện, dùng nó
        if (serverMessage && !serverMessage.includes('status code') && !serverMessage.includes('Request failed')) {
          return rejectWithValue(serverMessage);
        }
        
        // Nếu không, tạo message thân thiện dựa trên status code
        if (status === 400 || status === 401) {
          return rejectWithValue('Tên đăng nhập hoặc mật khẩu không đúng');
        } else if (status === 403) {
          return rejectWithValue('Bạn không có quyền truy cập');
        } else if (status >= 500) {
          return rejectWithValue('Lỗi hệ thống. Vui lòng thử lại sau.');
        } else {
          return rejectWithValue('Đăng nhập thất bại. Vui lòng thử lại.');
        }
      } else if (error.request) {
        // Lỗi mạng
        return rejectWithValue('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        // Lỗi khác
        return rejectWithValue('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { 
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    dob?: string;
    gender?: string;
    verifiedCode: string;
    createAt: string;
  }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const sendVerificationCode = createAsyncThunk(
  'auth/sendVerificationCode',
  async (email: string, { rejectWithValue }) => {
    try {
      console.log('sendVerificationCode thunk: Sending request for email:', email);
      const response = await authAPI.sendVerificationCode(email);
      console.log('sendVerificationCode thunk: Response received:', response.data);
      
      // Backend returns ApiResponses with structure: { code: int, result: string }
      // Check if code is 1000 (success)
      if (response.data && response.data.code === 1000) {
        console.log('sendVerificationCode thunk: Success, returning result:', response.data.result);
        return { success: true, message: response.data.result };
      } else {
        // If code is not 1000, treat as error
        const errorMsg = response.data?.result || 'Failed to send verification code';
        console.error('sendVerificationCode thunk: Code is not 1000, rejecting with:', errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error: any) {
      console.error('sendVerificationCode thunk: Error caught:', error);
      // Backend returns ApiResponses with structure: { code: int, result: string }
      // Error message is in result field, not message field
      const errorMessage = error.response?.data?.result || error.response?.data?.message || error.message || 'Failed to send verification code';
      console.error('sendVerificationCode thunk: Rejecting with error message:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentToken = state.auth.token;
      const refreshTokenValue = state.auth.refreshToken;
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      // Validate current token before refresh (optional check)
      if (currentToken) {
        try {
          const introspectResponse = await authAPI.introspectToken(currentToken);
          const isValid = introspectResponse.data?.code === 1000 && introspectResponse.data?.result?.valid;
          
          // If token is still valid, no need to refresh
          if (isValid) {
            return {
              token: currentToken,
              refreshToken: refreshTokenValue,
            };
          }
        } catch (introspectError) {
          // Introspect failed, continue with refresh
        }
      }
      
      // Call refresh token API
      const response = await authAPI.refreshToken(refreshTokenValue);
      
      // Handle wrapped response format: { code: 1000, result: { token, refreshToken } }
      if (response.data && typeof response.data === 'object') {
        if ('code' in response.data && 'result' in response.data && response.data.code === 1000) {
          return {
            token: response.data.result.token,
            refreshToken: response.data.result.refreshToken || refreshTokenValue,
          };
        }
        // Direct format: { token, refreshToken }
        if ('token' in response.data) {
          return {
            token: response.data.token,
            refreshToken: response.data.refreshToken || refreshTokenValue,
          };
        }
      }
      
      // Fallback: return as-is (shouldn't happen)
      throw new Error('Invalid refresh token response format');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;
      
      if (token) {
        await authAPI.logout(token);
      }
    } catch (error: any) {
      // Even if logout fails on server (e.g., token expired), we should clear local state
      // Don't log 401 errors for logout - it's expected that token might be expired
      if (error?.response?.status !== 401) {
        // Log other errors if needed
      }
    }
    
    // Clear tokens from storage regardless of server response
    tokenStorage.clearTokens();
    
    return { success: true };
  }
);

// NOTE: getCurrentUser endpoint does not exist in Backend
// Use adminAPI.getMyInfo() or doctorAPI.getMyProfile() instead
// export const getCurrentUser = createAsyncThunk(
//   'auth/getCurrentUser',
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       const state = getState() as { auth: AuthState };
//       const token = state.auth.token;
      
//       if (!token) {
//         throw new Error('No token available');
//       }
      
//       const response = await authAPI.getCurrentUser(token);
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to get user info');
//     }
//   }
// );

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.forgotPassword(username);
      // Backend returns ApiResponses with structure: { code: int, result: string }
      // Check if code is 1000 (success)
      if (response.data && response.data.code === 1000) {
        return { success: true, message: response.data.result };
      } else {
        // If code is not 1000, treat as error
        const errorMsg = response.data?.result || 'Failed to send reset password request';
        return rejectWithValue(errorMsg);
      }
    } catch (error: any) {
      // Backend returns ApiResponses with structure: { code: int, result: string }
      // Error message is in result field, not message field
      const errorMessage = error.response?.data?.result || error.response?.data?.message || error.message || 'Failed to send reset password request';
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyResetPassword = createAsyncThunk(
  'auth/verifyResetPassword',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyResetPassword(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify reset password');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: { id: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.resetPassword(data.id, data.newPassword);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
    }
  }
);

export const introspectToken = createAsyncThunk(
  'auth/introspectToken',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.introspectToken(token);
      
      if (response.data.code === 1000) {
        return response.data.result.valid;
      } else {
        throw new Error('Token introspection failed: Invalid response format');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token validation failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetLoading: (state) => {
      state.isLoading = false;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      // Clear tokens from storage
      tokenStorage.clearTokens();
    },
    // Initialize auth state from storage (called on app load)
    initializeAuth: (state) => {
      const token = tokenStorage.getToken();
      const refreshToken = tokenStorage.getRefreshToken();
      
      if (token) {
        // Check if token is expired before restoring
        if (isTokenExpired(token)) {
          // Token expired, clear it
          tokenStorage.clearTokens();
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.user = null;
          return;
        }
        
        // Token is valid, restore state
        state.token = token;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        
        // Decode token to get user info
        try {
          const payload = decodeTokenPayload<{ sub?: string }>(token);
          const derivedRole = extractRoleFromToken(token);
          state.user = {
            id: payload?.sub ?? 'unknown',
            username: payload?.sub ?? 'user',
            disable: false,
            role: derivedRole,
          };
        } catch (error) {
          // If token is invalid, clear it
          tokenStorage.clearTokens();
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.user = null;
        }
      } else {
        // No token found, ensure state is cleared
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.user = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        // Clear all cached queries when a new user logs in to avoid
        // showing stale/empty data from a previous session with the same query keys
        try {
          queryClient.clear();
        } catch {
          // Ignore cache clear errors to keep reducer safe
        }
        // Ensure any global logout flags in api client are reset
        try {
          resetLogoutState();
        } catch {
          // Ignore errors from resetting logout state
        }
        state.isLoading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
        state.error = null;
        const payload = decodeTokenPayload<{ sub?: string }>(action.payload.token);
        const derivedRole = extractRoleFromToken(action.payload.token);
        state.user = {
          id: payload?.sub ?? 'unknown',
          username: payload?.sub ?? 'user',
          disable: false,
          role: derivedRole,
        };
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Registration successful, but user needs to verify email
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Send Verification Code
      .addCase(sendVerificationCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendVerificationCode.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(sendVerificationCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        // Update token in storage (preserve rememberMe preference)
        const rememberMe = tokenStorage.getRememberMe();
        tokenStorage.saveToken(action.payload.token, action.payload.refreshToken, rememberMe);
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        // Clear cached queries on logout so the next login (possibly with another role)
        // will always refetch fresh data instead of reusing stale cache
        try {
          queryClient.clear();
        } catch {
          // Ignore cache clear errors
        }
        // Reset global logout state in api client so that new requests
        // after logout are not blocked by 'Logout in progress' guard
        try {
          resetLogoutState();
        } catch {
          // Ignore errors from resetting logout state
        }
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // NOTE: getCurrentUser endpoint does not exist in Backend
      // Get Current User
      // .addCase(getCurrentUser.pending, (state) => {
      //   state.isLoading = true;
      // })
      // .addCase(getCurrentUser.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.user = action.payload;
      //   state.isAuthenticated = true;
      // })
      // .addCase(getCurrentUser.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.error = action.payload as string;
      //   state.isAuthenticated = false;
      // })
      
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Verify Reset Password
      .addCase(verifyResetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyResetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyResetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Token Introspection
      .addCase(introspectToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(introspectToken.fulfilled, (state, action) => {
        state.isLoading = false;
        // Nếu token không hợp lệ, đăng xuất user
        if (!action.payload) {
          state.user = null;
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.error = 'Token is invalid';
        }
      })
      .addCase(introspectToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Nếu introspection thất bại, có thể token không hợp lệ
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, resetLoading, setCredentials, clearCredentials, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
