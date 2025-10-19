import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      // Vì backend không có API để lấy user role, 
      // mặc định chuyển hướng đến trang bệnh nhân
      // Bạn có thể thay đổi logic này dựa trên yêu cầu
      console.log('🔄 User authenticated, redirecting to patient dashboard');
      navigate('/patient', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return <>{children}</>;
};

export default RoleBasedRedirect;
