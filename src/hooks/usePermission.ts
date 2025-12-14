import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  extractPermissionsFromToken,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  type Permission,
} from '@/utils/permissions';

/**
 * Hook to check user permissions
 * @returns Object with permission checking functions and current permissions
 */
export const usePermission = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const permissions = useMemo(() => {
    if (!token || !isAuthenticated) {
      // #region agent log
      return [];
    }
    const extracted = extractPermissionsFromToken(token);
    // #region agent log
    return extracted;
  }, [token, isAuthenticated]);

  const checkPermission = useMemo(
    () => (permission: Permission) => hasPermission(token, permission),
    [token]
  );

  const checkAnyPermission = useMemo(
    () => (permissionsToCheck: Permission[]) => hasAnyPermission(token, permissionsToCheck),
    [token]
  );

  const checkAllPermissions = useMemo(
    () => (permissionsToCheck: Permission[]) => hasAllPermissions(token, permissionsToCheck),
    [token]
  );

  return {
    permissions,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    isAuthenticated,
  };
};

