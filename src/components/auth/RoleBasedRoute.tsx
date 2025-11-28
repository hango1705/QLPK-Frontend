import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Loading } from '@/components/ui';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
  fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles = [],
  requireAuth = true,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If user is authenticated but no roles are specified, allow access
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has any of the allowed roles
  const hasRequiredRole = user && allowedRoles.includes(user.role || 'user');

  if (!hasRequiredRole) {
    // Redirect to unauthorized page or home
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
