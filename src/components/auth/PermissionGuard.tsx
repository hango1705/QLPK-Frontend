import React from 'react';
import { usePermission, type Permission } from '@/hooks';

interface PermissionGuardProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Component to conditionally render children based on user permissions
 * @param permission - Single permission or array of permissions to check
 * @param requireAll - If true, user must have all permissions. If false, user needs any permission (default: false)
 * @param fallback - Optional component to render if permission check fails
 * @param children - Content to render if permission check passes
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  requireAll = false,
  fallback = null,
  children,
}) => {
  // #region agent log
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  const hasAccess = Array.isArray(permission)
    ? requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission);
  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

