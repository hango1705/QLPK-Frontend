import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, Input, Alert } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { useAuth } from '@/hooks';
import authPageImg from '@/assets/auth_page_img.png';
import apiClient from '@/services/api/client';

// Validation schema
const forgotPasswordSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .required('Tên đăng nhập là bắt buộc'),
});

type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

const passwordResetSchema = yup.object({
  id: yup.string().required('Mã đặt lại là bắt buộc'),
  newPassword: yup
    .string()
    .min(8, 'Mật khẩu ít nhất 8 ký tự.')
    .required('Mật khẩu mới là bắt buộc'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Xác nhận mật khẩu không đúng')
    .required('Xác nhận mật khẩu là bắt buộc'),
});

type PasswordResetFormData = yup.InferType<typeof passwordResetSchema>;

const ForgotPasswordPage = () => {
  const { clearError, forgotPassword } = useAuth();
  const [step, setStep] = useState(1); // 1=send mail, 2=nhập id+mật khẩu mới, 3=thành công
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Step 1: Nhập username
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema) as any,
    defaultValues: { username: '' },
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: errorsReset },
    reset: resetResetForm,
  } = useForm<PasswordResetFormData>({
    resolver: yupResolver(passwordResetSchema) as any,
    defaultValues: { id: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const result = await forgotPassword(data.username);
      if (result.type === 'auth/forgotPassword/fulfilled') {
        setStep(2);
      } else {
        showNotification.error(result.payload || 'Gửi yêu cầu thất bại');
      }
    } catch (error) {
      showNotification.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Đặt lại mật khẩu
  const onResetPassword = async (data: PasswordResetFormData) => {
    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/auth/resetPassword', { id: data.id, newPassword: data.newPassword });
      setResetSuccess(true);
      setStep(3);
      resetResetForm();
      showNotification.success('Đổi mật khẩu thành công. Đăng nhập lại với mật khẩu mới!');
    } catch (error) {
      showNotification.error('Đổi mật khẩu thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3 && resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg px-12 py-10 text-center w-full max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold mb-2">Đổi mật khẩu thành công!</h2>
          <p className="mb-6">Bạn đã có thể đăng nhập với mật khẩu mới.</p>
              <Link to="/login">
            <Button variant="primary" size="lg" className="w-full">Quay lại đăng nhập</Button>
              </Link>
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
        {step === 1 && (
          <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-2">Quên mật khẩu?</h2>
            <p>Nhập tên đăng nhập của bạn để nhận link khôi phục mật khẩu</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input {...register('username')} type="text" placeholder="Tên đăng nhập" error={!!errors.username} helperText={errors.username?.message} />
            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">Gửi link khôi phục</Button>
          </form>
          </>) }
        {step === 2 && (
          <>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Đặt lại mật khẩu</h2>
            <p className="text-sm text-muted-foreground mb-2">Nhập Mã đặt lại mật khẩu (mã trong link email) và nhập mật khẩu mới.</p>
          </div>
          <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-6">
            <Input {...registerReset('id')} placeholder="Mã đặt lại (ID trong đường link email)" error={!!errorsReset.id} helperText={errorsReset.id?.message} />
            <Input {...registerReset('newPassword')} type="password" placeholder="Mật khẩu mới" error={!!errorsReset.newPassword} helperText={errorsReset.newPassword?.message} />
            <Input {...registerReset('confirmPassword')} type="password" placeholder="Nhập lại mật khẩu mới" error={!!errorsReset.confirmPassword} helperText={errorsReset.confirmPassword?.message} />
            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">Lưu mật khẩu mới</Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>← Gửi lại mail</Button>
          </form>
          </>) }
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
