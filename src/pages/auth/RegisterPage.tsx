import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks';
import { useDispatch, useSelector } from 'react-redux';
import { sendVerificationCode as sendVerificationCodeAction } from '@/store/slices/authSlice';
import { setCurrentStep, setFormData, setCountdown, resetRegisterState } from '@/store/slices/registerStepSlice';
import { RootState } from '@/store';
import { useNotification } from '@/components/ui';
import authPageImg from '@/assets/auth_page_img.png';

// Validation schemas for each step
const step1Schema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
});

const step2Schema = yup.object({
  verifiedCode: yup
    .string()
    .length(6, 'Mã xác thực phải có 6 chữ số')
    .matches(/^\d{6}$/, 'Mã xác thực chỉ được chứa số')
    .required('Mã xác thực là bắt buộc'),
});

const step3Schema = yup.object({
  username: yup
    .string()
    .required('Tên đăng nhập là bắt buộc')
    .min(8, 'Tên đăng nhập phải có ít nhất 8 ký tự'),
  fullName: yup.string().required('Họ tên là bắt buộc'),
  phone: yup.string().required('Số điện thoại là bắt buộc'),
  password: yup
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số')
    .required('Mật khẩu là bắt buộc'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Xác nhận mật khẩu là bắt buộc'),
});

const step4Schema = yup.object({
  dob: yup
    .string()
    .required('Ngày sinh là bắt buộc')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải có định dạng yyyy-MM-dd'),
  gender: yup.string().required('Giới tính là bắt buộc'),
  address: yup.string().required('Địa chỉ là bắt buộc'),
  agreeToTerms: yup.boolean().oneOf([true], 'Bạn phải đồng ý với điều khoản'),
});

type Step1Data = yup.InferType<typeof step1Schema>;
type Step2Data = yup.InferType<typeof step2Schema>;
type Step3Data = yup.InferType<typeof step3Schema>;
type Step4Data = yup.InferType<typeof step4Schema>;

const RegisterPage = () => {
  const dispatch = useDispatch();
  const registerStep = useSelector((state: RootState) => state.registerStep);
  const { currentStep, formData, countdown } = registerStep;
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const notification = useNotification();
  
  // Debug component mount
  useEffect(() => {
    return () => {
    };
  }, []);

  // Debug currentStep changes
  useEffect(() => {
  }, [currentStep]);
  const [step1Submitted, setStep1Submitted] = useState(false);
  const [step2Submitted, setStep2Submitted] = useState(false);
  const [step3Submitted, setStep3Submitted] = useState(false);
  const [step4Submitted, setStep4Submitted] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const step1Form = useForm<Step1Data>({
    resolver: yupResolver(step1Schema) as any,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
    defaultValues: {
      email: formData.email || '',
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: yupResolver(step2Schema) as any,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      verifiedCode: formData.verifiedCode || '',
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: yupResolver(step3Schema) as any,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      username: formData.username || '',
      fullName: formData.fullName || '',
      phone: formData.phone || '',
      password: formData.password || '',
      confirmPassword: formData.confirmPassword || '',
    },
  });

  const step4Form = useForm<Step4Data>({
    resolver: yupResolver(step4Schema) as any,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      dob: formData.dob || '',
      gender: formData.gender || '',
      address: formData.address || '',
      agreeToTerms: formData.agreeToTerms || false,
    },
  });

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError();
    // Reset form states to clear any initial validation errors
    step1Form.clearErrors();
    step2Form.clearErrors();
    step3Form.clearErrors();
    step4Form.clearErrors();
    // Reset submitted states
    setStep1Submitted(false);
    setStep2Submitted(false);
    setStep3Submitted(false);
    setStep4Submitted(false);
  }, []); // Remove clearError from dependencies to prevent re-runs

  // Countdown timer for resend verification code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => dispatch(setCountdown(countdown - 1)), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, dispatch]);

  // Update form values when formData changes
  useEffect(() => {
    step1Form.reset({
      email: formData.email || '',
    });
  }, [formData.email]);

  useEffect(() => {
    step2Form.reset({
      verifiedCode: formData.verifiedCode || '',
    });
  }, [formData.verifiedCode]);

  useEffect(() => {
    step3Form.reset({
      username: formData.username || '',
      fullName: formData.fullName || '',
      phone: formData.phone || '',
      password: formData.password || '',
      confirmPassword: formData.confirmPassword || '',
    });
  }, [formData.username, formData.fullName, formData.phone, formData.password, formData.confirmPassword]);

  useEffect(() => {
    step4Form.reset({
      dob: formData.dob || '',
      gender: formData.gender || '',
      address: formData.address || '',
      agreeToTerms: formData.agreeToTerms || false,
    });
  }, [formData.dob, formData.gender, formData.address, formData.agreeToTerms]);

  const steps = [
    { number: 1, title: 'Xác thực Email', description: 'Nhập email để nhận mã xác thực' },
    { number: 2, title: 'Nhập mã xác thực', description: 'Nhập mã 6 chữ số từ email' },
    { number: 3, title: 'Thông tin tài khoản', description: 'Tạo tên đăng nhập và mật khẩu' },
    { number: 4, title: 'Thông tin cá nhân', description: 'Hoàn tất thông tin cá nhân' },
  ];

  const handleStep1Submit = async (data: Step1Data) => {
    try {
      const result = await dispatch(sendVerificationCodeAction(data.email));
      
      // Check if the action was fulfilled (successful) using Redux Toolkit pattern
      if (sendVerificationCodeAction.fulfilled.match(result)) {
        dispatch(setFormData(data));
        setIsVerificationSent(true);
        dispatch(setCountdown(120)); // 2 minutes countdown
        dispatch(setCurrentStep(2));
        notification.success('Mã xác thực đã được gửi đến email của bạn!');
      } else if (sendVerificationCodeAction.rejected.match(result)) {
        notification.error((result.payload as string) || 'Không thể gửi mã xác thực. Vui lòng thử lại.');
      }
    } catch (error: any) {
      notification.error(error.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.');
    }
  };

  const handleStep1FormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Submitted(true);
    step1Form.handleSubmit(handleStep1Submit)(e);
  };

  const handleStep2Submit = (data: Step2Data) => {
    dispatch(setFormData(data));
    dispatch(setCurrentStep(3));
    step2Form.clearErrors();
  };

  const handleStep3Submit = (data: Step3Data) => {
    dispatch(setFormData(data));
    dispatch(setCurrentStep(4));
    step3Form.clearErrors();
  };

  const handleStep4Submit = async (data: Step4Data) => {
    try {
      const finalData: any = { ...formData, ...data };
      const createAt = new Date().toISOString().split('T')[0]; // yyyy-MM-dd
      await registerUser({
        username: finalData.username,
        password: finalData.password,
        fullName: finalData.fullName,
        email: finalData.email,
        phone: finalData.phone,
        address: finalData.address,
        dob: finalData.dob,
        gender: finalData.gender,
        verifiedCode: finalData.verifiedCode,
        createAt: createAt,
      });
      notification.success('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
    } catch (error) {
      notification.error('Đăng ký thất bại');
    }
  };

  const handleResendVerification = async () => {
    if (countdown > 0) return;
    
    try {
      const result = await dispatch(sendVerificationCodeAction(formData.email!));
      
      // Check if the action was fulfilled (successful) using Redux Toolkit pattern
      if (sendVerificationCodeAction.fulfilled.match(result)) {
        dispatch(setCountdown(120));
        notification.success('Mã xác thực mới đã được gửi!');
      } else if (sendVerificationCodeAction.rejected.match(result)) {
        notification.error((result.payload as string) || 'Không thể gửi lại mã xác thực. Vui lòng thử lại.');
      }
    } catch (error: any) {
      notification.error(error.message || 'Không thể gửi lại mã xác thực. Vui lòng thử lại.');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      dispatch(setCurrentStep(currentStep - 1));
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleStep1FormSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Xác thực Email</h3>
        <p className="text-muted-foreground text-sm">
          Chúng tôi sẽ gửi mã xác thực 6 chữ số đến email của bạn
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Email
        </label>
        <Input
          {...step1Form.register('email')}
          type="email"
          placeholder="nguyenvana@email.com"
          error={step1Submitted && !!step1Form.formState.errors.email}
          helperText={step1Submitted && step1Form.formState.errors.email ? step1Form.formState.errors.email.message : undefined}
        />
      </div>

      <Button 
        variant="primary" 
        size="lg" 
        className="w-full" 
        htmlType="submit"
        loading={isLoading}
      >
        Gửi mã xác thực
      </Button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nhập mã xác thực</h3>
        <p className="text-muted-foreground text-sm">
          Vui lòng nhập mã 6 chữ số đã được gửi đến <strong>{formData.email}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Mã xác thực
        </label>
        <Input
          {...step2Form.register('verifiedCode')}
          type="text"
          placeholder="123456"
          maxLength={6}
          className="text-center text-2xl tracking-widest w-full"
          error={!!step2Form.formState.errors.verifiedCode}
          helperText={step2Form.formState.errors.verifiedCode?.message}
        />
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Không nhận được mã?
        </p>
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={countdown > 0}
          className={`text-sm font-medium ${
            countdown > 0 
              ? 'text-muted-foreground cursor-not-allowed' 
              : 'text-primary hover:text-primary/80'
          }`}
        >
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <Button variant="primary" size="lg" className="w-full" htmlType="submit">
          Xác thực
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={goToPreviousStep}>
          Quay lại
        </Button>
      </div>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Thông tin tài khoản</h3>
        <p className="text-muted-foreground text-sm">
          Tạo tên đăng nhập và mật khẩu cho tài khoản của bạn
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tên đăng nhập
        </label>
        <Input
          {...step3Form.register('username')}
          placeholder="nguyenvana"
          error={!!step3Form.formState.errors.username}
          helperText={step3Form.formState.errors.username?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Họ và tên
        </label>
        <Input
          {...step3Form.register('fullName')}
          placeholder="Nguyễn Văn A"
          error={!!step3Form.formState.errors.fullName}
          helperText={step3Form.formState.errors.fullName?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Số điện thoại
        </label>
        <Input
          {...step3Form.register('phone')}
          type="tel"
          placeholder="0123456789"
          error={!!step3Form.formState.errors.phone}
          helperText={step3Form.formState.errors.phone?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Mật khẩu
        </label>
        <Input
          {...step3Form.register('password')}
          type="password"
          placeholder="••••••••"
          error={!!step3Form.formState.errors.password}
          helperText={step3Form.formState.errors.password?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Xác nhận mật khẩu
        </label>
        <Input
          {...step3Form.register('confirmPassword')}
          type="password"
          placeholder="••••••••"
          error={!!step3Form.formState.errors.confirmPassword}
          helperText={step3Form.formState.errors.confirmPassword?.message}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Button variant="primary" size="lg" className="w-full" htmlType="submit">
          Tiếp tục
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={goToPreviousStep}>
          Quay lại
        </Button>
      </div>
    </form>
  );

  const renderStep4 = () => (
    <form onSubmit={step4Form.handleSubmit(handleStep4Submit)} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Thông tin cá nhân</h3>
        <p className="text-muted-foreground text-sm">
          Hoàn tất thông tin cá nhân để hoàn thành đăng ký
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Ngày sinh
        </label>
        <Input
          {...step4Form.register('dob')}
          type="date"
          error={!!step4Form.formState.errors.dob}
          helperText={step4Form.formState.errors.dob?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Giới tính
        </label>
        <select
          {...step4Form.register('gender')}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Chọn giới tính</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
        {step4Form.formState.errors.gender && (
          <p className="text-sm text-destructive mt-1">{step4Form.formState.errors.gender.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Địa chỉ
        </label>
        <Input
          {...step4Form.register('address')}
          placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
          error={!!step4Form.formState.errors.address}
          helperText={step4Form.formState.errors.address?.message}
        />
      </div>

      <div className="flex items-start">
        <input
          {...step4Form.register('agreeToTerms')}
          type="checkbox"
          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 mt-1"
        />
        <label className="ml-2 text-sm text-muted-foreground">
          Tôi đồng ý với{' '}
          <Link to="/terms" className="text-primary hover:text-primary/80">
            Điều khoản sử dụng
          </Link>{' '}
          và{' '}
          <Link to="/privacy" className="text-primary hover:text-primary/80">
            Chính sách bảo mật
          </Link>
        </label>
      </div>
      {step4Form.formState.errors.agreeToTerms && (
        <p className="text-sm text-destructive">{step4Form.formState.errors.agreeToTerms.message}</p>
      )}

      <div className="flex flex-col gap-6">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          loading={isLoading}
          htmlType="submit"
        >
          Hoàn tất đăng ký
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={goToPreviousStep}>
          Quay lại
        </Button>
      </div>
    </form>
  );

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

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-2">Đăng ký</h2>
            <p className="text-muted-foreground">Tạo tài khoản mới</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.number
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs font-medium text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card variant="filled" padding="md" className="mb-6">
              <p className="text-destructive text-sm">{error}</p>
            </Card>
          )}

          {/* Form Steps */}
          <Card variant="elevated" padding="lg">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </Card>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
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

export default RegisterPage;
