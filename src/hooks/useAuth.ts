import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '@/store';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  getCurrentUser,
  sendVerificationCode,
  clearError as clearAuthError,
  resetLoading
} from '@/store/slices/authSlice';
import { 
  fetchUserProfile, 
  updateUserProfile, 
  uploadAvatar,
  changePassword,
  clearUserError 
} from '@/store/slices/userSlice';

// Auth hooks
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const login = useCallback((credentials: { username: string; password: string }) => {
    return dispatch(loginUser(credentials));
  }, [dispatch]);

  const register = useCallback((userData: { 
    username: string;
    password: string;
    full_name: string;
    email: string;
    phone?: string;
    address?: string;
    dob?: string;
    gender?: string;
    verificationCode: string;
  }) => {
    return dispatch(registerUser(userData));
  }, [dispatch]);

  const sendVerification = useCallback((email: string) => {
    return dispatch(sendVerificationCode(email));
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  const getCurrentUserInfo = useCallback(() => {
    return dispatch(getCurrentUser());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const resetLoadingState = useCallback(() => {
    dispatch(resetLoading());
  }, [dispatch]);

  return {
    ...auth,
    login,
    register,
    sendVerificationCode: sendVerification,
    logout,
    getCurrentUserInfo,
    clearError,
    resetLoading: resetLoadingState,
  };
};

// User hooks
export const useUser = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user);

  const fetchProfile = useCallback((userId: string) => {
    return dispatch(fetchUserProfile(userId));
  }, [dispatch]);

  const updateProfile = useCallback((userId: string, profileData: any) => {
    return dispatch(updateUserProfile({ userId, profileData }));
  }, [dispatch]);

  const uploadUserAvatar = useCallback((userId: string, file: File) => {
    return dispatch(uploadAvatar({ userId, file }));
  }, [dispatch]);

  const changeUserPassword = useCallback((userId: string, currentPassword: string, newPassword: string) => {
    return dispatch(changePassword({ userId, currentPassword, newPassword }));
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearUserError());
  }, [dispatch]);

  return {
    ...user,
    fetchProfile,
    updateProfile,
    uploadAvatar: uploadUserAvatar,
    changePassword: changeUserPassword,
    clearError,
  };
};

// Combined auth + user hook
export const useAuthUser = () => {
  const auth = useAuth();
  const user = useUser();

  return {
    ...auth,
    ...user,
    // Helper methods
    isLoggedIn: auth.isAuthenticated && !!auth.user,
    // Note: Role-based helpers removed as User interface doesn't have role field
  };
};
