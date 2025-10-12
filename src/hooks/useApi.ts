import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryClient';
import { authAPI } from '@/services/api/auth';
import { userAPI } from '@/services/api/user';
import { showNotification } from '@/components/ui';

// Auth queries
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: async () => {
      const response = await authAPI.getCurrentUser('');
      return response.data;
    },
    enabled: false, // Only run when explicitly called
  });
};

// User queries
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: async () => {
      const response = await userAPI.getProfile(userId);
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useUserAppointments = (userId: string, params?: any) => {
  return useQuery({
    queryKey: queryKeys.user.appointments(userId),
    queryFn: async () => {
      const response = await userAPI.getAppointments(userId, params);
      return response.data;
    },
    enabled: !!userId,
  });
};

// User mutations
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, profileData }: { userId: string; profileData: any }) =>
      userAPI.updateProfile(userId, profileData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.profile(variables.userId),
      });
      showNotification.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      showNotification.error('Failed to update profile', error.message);
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      userAPI.uploadAvatar(userId, file),
    onSuccess: (data, variables) => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.profile(variables.userId),
      });
      showNotification.success('Avatar uploaded successfully!');
    },
    onError: (error: any) => {
      showNotification.error('Failed to upload avatar', error.message);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ userId, currentPassword, newPassword }: { 
      userId: string; 
      currentPassword: string; 
      newPassword: string; 
    }) => userAPI.changePassword(userId, { currentPassword, newPassword }),
    onSuccess: () => {
      showNotification.success('Password changed successfully!');
    },
    onError: (error: any) => {
      showNotification.error('Failed to change password', error.message);
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      userAPI.deleteAccount(userId, password),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      showNotification.success('Account deleted successfully');
      // Redirect to home page
      window.location.href = '/';
    },
    onError: (error: any) => {
      showNotification.error('Failed to delete account', error.message);
    },
  });
};
