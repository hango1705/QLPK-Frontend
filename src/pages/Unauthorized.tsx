import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import authPageImg from '@/assets/auth_page_img.png';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Visual/Marketing Section */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <img
            src={authPageImg}
            alt="Dental care background"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-primary/20" />
        </div>
        
        {/* Text Overlay */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 h-full">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6 font-sans tracking-wide" style={{ color: '#0ea5e9' }}>
              Smile Dental Clinic
            </h1>
            <p className="text-xl leading-relaxed font-light" style={{ color: '#0ea5e9' }}>
              "Nụ cười của bạn là ưu tiên của chúng tôi - Chăm sóc nha khoa chuyên nghiệp với tình yêu thương"
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Unauthorized Message */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
        <div className="max-w-md mx-auto w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">Truy cập bị từ chối</h2>
          <p className="text-muted-foreground mb-8">
            Bạn không có quyền truy cập vào trang này. 
            Vui lòng liên hệ quản trị viên nếu bạn cần hỗ trợ.
          </p>
          
          <div className="space-y-4">
            <Link to="/">
              <Button variant="primary" size="lg" className="w-full">
                Về trang chủ
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full">
                Đăng nhập với tài khoản khác
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
