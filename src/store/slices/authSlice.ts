import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '@/services/api/auth';

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
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('🔐 Attempting login with credentials:', { username: credentials.username });
      const response = await authAPI.login(credentials);
      console.log('✅ Login successful:', response.data);
      
      // Xử lý response theo format API documentation
      if (response.data.code === 1000 && response.data.result.authenticated) {
        return {
          token: response.data.result.token,
          authenticated: response.data.result.authenticated
        };
      } else {
        throw new Error('Login failed: Invalid response format');
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
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
      const response = await authAPI.sendVerificationCode(email);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send verification code');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshTokenValue = state.auth.refreshToken;
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      const response = await authAPI.refreshToken(refreshTokenValue);
      return response.data;
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
    } catch (error) {
      // Even if logout fails on server, we should clear local state
      console.error('Logout error:', error);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No token available');
      }
      
      const response = await authAPI.getCurrentUser(token);
      console.log('🔍 getCurrentUser response:', response);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user info');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.forgotPassword(username);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send reset password request');
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
      console.log('🔍 Introspecting token:', token.substring(0, 20) + '...');
      const response = await authAPI.introspectToken(token);
      console.log('✅ Token introspection response:', response.data);
      
      if (response.data.code === 1000) {
        return response.data.result.valid;
      } else {
        throw new Error('Token introspection failed: Invalid response format');
      }
    } catch (error: any) {
      console.error('❌ Token introspection failed:', error);
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
        state.isLoading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
        state.error = null;
        // Không cần fetch user info vì backend không có API /auth/me
        // Mặc định set user role là 'patient' nếu cần
        state.user = {
          id: 'temp-id',
          username: 'user',
          disable: false,
          role: 'patient' // Mặc định là patient
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
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
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

export const { clearError, resetLoading, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
