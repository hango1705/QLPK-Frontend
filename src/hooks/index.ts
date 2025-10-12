// Auth hooks
export { useAuth, useUser, useAuthUser } from './useAuth';

// API hooks
export { 
  useCurrentUser,
  useUserProfile,
  useUserAppointments,
  useUpdateProfile,
  useUploadAvatar,
  useChangePassword,
  useDeleteAccount
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

// Existing hooks
export { useIsMobile } from './use-mobile';
