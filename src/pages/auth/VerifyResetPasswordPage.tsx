import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Alert } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { useAuth } from '@/hooks';
import authPageImg from '@/assets/auth_page_img.png';

const VerifyResetPasswordPage = () => {
  const { clearError, verifyResetPassword, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    id: string;
  } | null>(null);

  const id = searchParams.get('id');

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Auto-verify when component mounts if id is present
  useEffect(() => {
    if (id && !verificationResult) {
      handleVerify();
    }
  }, [id]);

  const handleVerify = async () => {
    if (!id) {
      showNotification.error('ID không hợp lệ');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyResetPassword(id);
      
      if (result.payload) {
        setVerificationResult({
          isValid: result.payload.result?.valid || false,
          id: result.payload.result?.id || id
        });
        
        if (result.payload.result?.valid) {
          showNotification.success('Xác thực thành công! Bạn có thể đặt lại mật khẩu.');
        } else {
          showNotification.error('Link xác thực không hợp lệ hoặc đã hết hạn.');
        }
      }
    } catch (error) {
      showNotification.error('Có lỗi xảy ra khi xác thực. Vui lòng thử lại.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinue = () => {
    if (verificationResult?.isValid) {
      navigate(`/reset-password?id=${verificationResult.id}`);
    }
  };

  if (!id) {
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
              <h1 className="text-5xl font-bold mb-6 font-sans tracking-wide" style={{ color: '#fff' }}>
                Smile Dental Clinic
              </h1>
              <p className="text-xl leading-relaxed font-light" style={{ color: '#fff' }}>
                "Nụ cười của bạn là ưu tiên của chúng tôi - Chăm sóc nha khoa chuyên nghiệp với tình yêu thương"
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Error */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-4">Link không hợp lệ</h2>
            <p className="text-muted-foreground mb-8">
              Link xác thực không hợp lệ. 
              Vui lòng yêu cầu link mới.
            </p>
            
            <Link to="/forgot-password">
              <Button variant="primary" size="lg" className="w-full">
                Yêu cầu link mới
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isVerifying) {
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

        {/* Right Panel - Loading */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-4">Đang xác thực...</h2>
            <p className="text-muted-foreground">
              Vui lòng chờ trong giây lát
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationResult && !verificationResult.isValid) {
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

        {/* Right Panel - Error */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-4">Xác thực thất bại</h2>
            <p className="text-muted-foreground mb-8">
              Link xác thực không hợp lệ hoặc đã hết hạn. 
              Vui lòng yêu cầu link mới.
            </p>
            
            <Link to="/forgot-password">
              <Button variant="primary" size="lg" className="w-full">
                Yêu cầu link mới
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (verificationResult && verificationResult.isValid) {
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

        {/* Right Panel - Success */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-4">Xác thực thành công!</h2>
            <p className="text-muted-foreground mb-8">
              Bạn có thể tiếp tục đặt lại mật khẩu của mình.
            </p>
            
            <div className="space-y-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleContinue}
              >
                Tiếp tục đặt lại mật khẩu
              </Button>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full">
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Right Panel - Verification Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
        <div className="max-w-md mx-auto w-full text-center">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-2">Xác thực reset mật khẩu</h2>
            <p className="text-muted-foreground">
              Đang xác thực link khôi phục mật khẩu của bạn
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full"
            onClick={handleVerify}
          >
            Xác thực
          </Button>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>

          {/* Back to Home Button */}
          <div className="mt-8 flex justify-center">
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetPasswordPage;
