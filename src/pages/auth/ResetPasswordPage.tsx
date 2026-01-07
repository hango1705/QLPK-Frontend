import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, Input } from '@/components/ui';
import { showNotification } from '@/components/ui';
import apiClient from '@/services/api/client';
import authPageImg from '@/assets/auth_page_img.png';

const passwordResetSchema = yup.object({
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

const ResetPasswordPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordResetFormData>({
    resolver: yupResolver(passwordResetSchema) as any,
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    if (!id) {
      showNotification.error('Không tìm thấy mã đặt lại từ đường dẫn.');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/auth/resetPassword', { id, newPassword: data.newPassword });
      setResetSuccess(true);
      reset();
      showNotification.success('Đổi mật khẩu thành công. Đăng nhập lại với mật khẩu mới!');
    } catch {
      showNotification.error('Đổi mật khẩu thất bại. Mã đặt lại có thể đã hết hạn hoặc không hợp lệ.');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
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
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <img
            src={authPageImg}
            alt="Dental care background"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-primary/20" />
        </div>
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
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-2">Đặt lại mật khẩu</h2>
            <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input {...register('newPassword')} type="password" placeholder="Mật khẩu mới" error={!!errors.newPassword} helperText={errors.newPassword?.message} />
            <Input {...register('confirmPassword')} type="password" placeholder="Nhập lại mật khẩu mới" error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">Lưu mật khẩu mới</Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary font-medium hover:underline">← Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
