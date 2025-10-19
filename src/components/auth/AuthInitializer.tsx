import React, { useEffect } from 'react';
import { useAuth } from '@/hooks';

interface AuthInitializerProps {
  children: React.ReactNode;
}

const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    // Không cần fetch user info vì backend không có API /auth/me
    // Chỉ cần kiểm tra token có tồn tại hay không
    if (token && !isAuthenticated) {
      console.log('🔄 Token exists but user not authenticated - this should not happen');
    }
  }, [token, isAuthenticated]);

  return <>{children}</>;
};

export default AuthInitializer;
