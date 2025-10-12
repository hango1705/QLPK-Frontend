import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Input, Alert } from '@/components/ui';
import { useAuth } from '@/hooks';
import { showNotification } from '@/components/ui';
import { loginUser } from '@/store/slices/authSlice';
import { loginSchema, type LoginFormData } from '@/schemas/auth';
import authPageImg from '@/assets/auth_page_img.png';

const LoginPage = () => {
  const { login, isLoading, error, clearError, resetLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Clear any existing errors and reset loading state when component mounts
  useEffect(() => {
    console.log('🚀 LoginPage mounted');
    clearError();
    // Reset loading state if it's stuck
    if (isLoading) {
      console.log('🔄 Resetting stuck loading state');
      resetLoading();
    }
  }, []); // Empty dependency array to run only once on mount

  // Clear loading state when component unmounts
  useEffect(() => {
    return () => {
      console.log('🚀 LoginPage unmounting');
      clearError();
      resetLoading();
    };
  }, []); // Empty dependency array to run only once on unmount

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema) as any,
    mode: 'onSubmit',
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  // Watch form values for debugging (can be removed in production)
  const watchedValues = watch();

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('🎯 Form submitted successfully with data:', data);
      console.log('🔄 Starting login process...');
      console.log('🔄 Calling login function...');
      
      const result = await login({
        username: data.username,
        password: data.password,
      });
      
      console.log('🔄 Login result:', result);
      
      // Check if login was successful
      if (loginUser.fulfilled.match(result)) {
        showNotification.success('Đăng nhập thành công!');
        console.log('✅ Login process completed successfully');
        // Don't navigate automatically, let user see the success message
      } else {
        showNotification.error('Đăng nhập thất bại');
        console.error('❌ Login process failed:', result.payload);
      }
    } catch (error) {
      console.error('❌ Login error caught:', error);
      showNotification.error('Đăng nhập thất bại');
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    showNotification.info(`Đăng nhập với ${provider} (Chức năng đang phát triển)`);
  };

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

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
        <div className="max-w-lg mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-2">Chào mừng</h2>
            <p className="text-muted-foreground">Đăng nhập bằng tài khoản</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              variant="error"
              message={error}
              closable
              onClose={clearError}
              className="mb-6"
            />
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(
            (data) => {
              console.log('🎯 Form submitted with data:', data);
              console.log('🎯 About to call onSubmit...');
              onSubmit(data);
              console.log('🎯 onSubmit completed');
            },
            (errors) => {
              console.log('❌ Form validation errors:', errors);
            }
          )} className="space-y-8" noValidate>
            {/* Username Field */}
            <div className="w-full">
              <label className="block text-sm font-medium text-foreground mb-3">
                Tên đăng nhập
              </label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <Input
                  {...register('username')}
                  type="text"
                  placeholder="Tên đăng nhập"
                  className="pl-10 w-full"
                  size="lg"
                  error={!!errors.username}
                  helperText={errors.username?.message}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="w-full">
              <label className="block text-sm font-medium text-foreground mb-3">
                Mật khẩu
              </label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 w-full"
                  size="lg"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mt-6">
              <label className="flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <span className="ml-2 text-sm text-muted-foreground">Ghi nhớ đăng nhập</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Login Button */}
            <div className="mt-8">
              <Button
                htmlType="submit"
                type="primary"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting}
                block
              >
                {isSubmitting ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
              </Button>
            </div>
          </form>

          {/* OR Separator */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-sm text-muted-foreground">HOẶC</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex justify-center mb-6">
            <Button
              variant="outline"
              className="flex items-center justify-center p-3 w-full max-w-xs"
              onClick={() => handleSocialLogin('google')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
            </Button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative Footer */}
        <div className="mt-12 flex justify-center">
          <Link to="/">
            <Button variant="outline" size="md" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay về trang chủ
            </Button>
          </Link>
        </div>
       </div>
     </div>
   );
 };

export default LoginPage;
