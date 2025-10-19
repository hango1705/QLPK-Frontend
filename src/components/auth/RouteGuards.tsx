import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Loading } from '@/components/ui';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

interface PrivateRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Guard for routes that require authentication
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // If user is already authenticated and trying to access public routes like login/register
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

// Guard for public routes (login, register, etc.)
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

// Guard for private routes (dashboard, profile, etc.)
export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Higher-order component for route protection
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean; redirectTo?: string } = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <AuthGuard {...options}>
      <Component {...props} />
    </AuthGuard>
  );

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Higher-order component for public route protection
export const withPublicGuard = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/'
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PublicRoute redirectTo={redirectTo}>
      <Component {...props} />
    </PublicRoute>
  );

  WrappedComponent.displayName = `withPublicGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Higher-order component for private route protection
export const withPrivateGuard = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/login'
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <PrivateRoute redirectTo={redirectTo}>
      <Component {...props} />
    </PrivateRoute>
  );

  WrappedComponent.displayName = `withPrivateGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
