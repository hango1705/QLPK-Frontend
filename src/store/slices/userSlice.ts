import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userAPI } from '@/services/api/user';

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

export interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  isUpdating: false,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile(userId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ userId, profileData }: { userId: string; profileData: Partial<UserProfile> }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(userId, profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async ({ userId, file }: { userId: string; file: File }, { rejectWithValue }) => {
    try {
      const response = await userAPI.uploadAvatar(userId, file);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload avatar');
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async ({ 
    userId, 
    currentPassword, 
    newPassword 
  }: { 
    userId: string; 
    currentPassword: string; 
    newPassword: string; 
  }, { rejectWithValue }) => {
    try {
      const response = await userAPI.changePassword(userId, {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async ({ userId, password }: { userId: string; password: string }, { rejectWithValue }) => {
    try {
      await userAPI.deleteAccount(userId, password);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete account');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    clearUserProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (state.profile) {
          state.profile.avatar = action.payload.avatar;
        }
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isUpdating = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // Delete Account
      .addCase(deleteAccount.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.isUpdating = false;
        state.profile = null;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUserError, setUserProfile, clearUserProfile } = userSlice.actions;
export default userSlice.reducer;
