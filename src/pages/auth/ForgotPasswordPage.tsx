import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, Input, Alert } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { useAuth } from '@/hooks';
import authPageImg from '@/assets/auth_page_img.png';

// Validation schema
const forgotPasswordSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .required('Tên đăng nhập là bắt buộc'),
});

type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const { clearError, forgotPassword } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema) as any,
    defaultValues: {
      username: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      // Call forgot password API
      await forgotPassword(data.username);
      
      setIsSubmitted(true);
      showNotification.success('Link khôi phục mật khẩu đã được gửi!');
    } catch (error) {
      showNotification.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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

        {/* Right Panel - Success Message */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-4">Link đã được gửi!</h2>
            <p className="text-muted-foreground mb-8">
              Chúng tôi đã gửi link khôi phục mật khẩu đến email của bạn. 
              Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
            </p>
            
            <div className="space-y-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => setIsSubmitted(false)}
              >
                Gửi lại email
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

      {/* Right Panel - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-2">Quên mật khẩu?</h2>
            <p className="text-muted-foreground">
              Nhập tên đăng nhập của bạn để nhận link khôi phục mật khẩu
            </p>
          </div>

          {/* Forgot Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <Input
                  {...register('username')}
                  type="text"
                  placeholder="Tên đăng nhập"
                  className="pl-10"
                  error={!!errors.username}
                  helperText={errors.username?.message}
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              Gửi link khôi phục
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Cần hỗ trợ?</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Nếu bạn không nhận được email trong vòng 5 phút, hãy:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Kiểm tra thư mục spam</li>
              <li>• Đảm bảo email được nhập chính xác</li>
              <li>• Liên hệ hotline: <span className="text-primary font-medium">0888705203</span></li>
            </ul>
          </div>
          {/* Help Text */}
          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Cần hỗ trợ?</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Nếu bạn không nhận được email trong vòng 5 phút, hãy:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Kiểm tra thư mục spam</li>
              <li>• Đảm bảo email được nhập chính xác</li>
              <li>• Liên hệ hotline: <span className="text-primary font-medium">0888705203</span></li>
            </ul>
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

export default ForgotPasswordPage;
