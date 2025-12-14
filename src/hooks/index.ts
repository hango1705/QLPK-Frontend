// Auth hooks
export { useAuth, useUser, useAuthUser } from './useAuth';

// API hooks
export { 
  // useCurrentUser, // NOTE: API does not exist in Backend
  useUserProfile,
  // useUserAppointments, // NOTE: API does not exist in Backend
  useUpdateProfile,
  // useUploadAvatar, // NOTE: API does not exist in Backend
  useChangePassword,
  // useDeleteAccount // NOTE: API does not exist in Backend
} from './useApi';

// Utility hooks
export {
  useLocalStorage,
  useSessionStorage,
  useDebounce,
  useThrottle,
  usePrevious,
  useOnlineStatus,
  useCopyToClipboard,
  useProtectedRoute,
  useFormValidation
} from './useUtils';

// Permission hooks
export { usePermission } from './usePermission';

// Existing hooks
export { useIsMobile } from './use-mobile';
