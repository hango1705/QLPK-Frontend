import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { getDefaultRouteForRole } from '@/utils/auth';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRouteForRole(user?.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);

  return <>{children}</>;
};

export default RoleBasedRedirect;
