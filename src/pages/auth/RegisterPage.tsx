import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks';
import { showNotification } from '@/components/ui';
import authPageImg from '@/assets/auth_page_img.png';

// Validation schemas for each step
const step1Schema = yup.object({
  username: yup.string().required('Tên đăng nhập là bắt buộc'),
  full_name: yup.string().required('Họ tên là bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  phone: yup.string().required('Số điện thoại là bắt buộc'),
});

const step2Schema = yup.object({
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

const step3Schema = yup.object({
  dob: yup.string().required('Ngày sinh là bắt buộc'),
  gender: yup.string().required('Giới tính là bắt buộc'),
  address: yup.string().required('Địa chỉ là bắt buộc'),
  agreeToTerms: yup.boolean().oneOf([true], 'Bạn phải đồng ý với điều khoản'),
});

type Step1Data = yup.InferType<typeof step1Schema>;
type Step2Data = yup.InferType<typeof step2Schema>;
type Step3Data = yup.InferType<typeof step3Schema>;

const RegisterPage = () => {
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({});
  const [step1Submitted, setStep1Submitted] = useState(false);
  const [step2Submitted, setStep2Submitted] = useState(false);
  const [step3Submitted, setStep3Submitted] = useState(false);

  const step1Form = useForm<Step1Data>({
    resolver: yupResolver(step1Schema) as any,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
    defaultValues: {
      username: formData.username || '',
      full_name: formData.full_name || '',
      email: formData.email || '',
      phone: formData.phone || '',
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: yupResolver(step2Schema) as any,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      password: formData.password || '',
      confirmPassword: formData.confirmPassword || '',
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: yupResolver(step3Schema) as any,
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
    // Reset submitted states
    setStep1Submitted(false);
    setStep2Submitted(false);
    setStep3Submitted(false);
  }, [clearError, step1Form, step2Form, step3Form]);

  // Update form values when formData changes
  useEffect(() => {
    step1Form.reset({
      username: formData.username || '',
      full_name: formData.full_name || '',
      email: formData.email || '',
      phone: formData.phone || '',
    });
  }, [formData.username, formData.full_name, formData.email, formData.phone, step1Form]);

  useEffect(() => {
    step2Form.reset({
      password: formData.password || '',
      confirmPassword: formData.confirmPassword || '',
    });
  }, [formData.password, formData.confirmPassword, step2Form]);

  useEffect(() => {
    step3Form.reset({
      dob: formData.dob || '',
      gender: formData.gender || '',
      address: formData.address || '',
      agreeToTerms: formData.agreeToTerms || false,
    });
  }, [formData.dob, formData.gender, formData.address, formData.agreeToTerms, step3Form]);

  const steps = [
    { number: 1, title: 'Thông tin cơ bản', description: 'Nhập thông tin cá nhân' },
    { number: 2, title: 'Bảo mật', description: 'Tạo mật khẩu an toàn' },
    { number: 3, title: 'Hoàn tất', description: 'Xác nhận và đăng ký' },
  ];

  const handleStep1Submit = (data: Step1Data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
    setStep1Submitted(false); // Reset submitted state
    // Clear any errors when moving to next step
    step1Form.clearErrors();
  };

  const handleStep1FormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Submitted(true);
    step1Form.handleSubmit(handleStep1Submit)(e);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
    // Clear any errors when moving to next step
    step2Form.clearErrors();
  };

  const handleStep3Submit = async (data: Step3Data) => {
    try {
      const finalData = { ...formData, ...data };
      await registerUser({
        username: finalData.username!,
        password: finalData.password!,
        full_name: finalData.full_name!,
        email: finalData.email!,
        phone: finalData.phone,
        address: finalData.address,
        dob: finalData.dob,
        gender: finalData.gender,
      });
      showNotification.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
    } catch (error) {
      showNotification.error('Đăng ký thất bại');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleStep1FormSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tên đăng nhập
        </label>
        <Input
          {...step1Form.register('username')}
          placeholder="nguyenvana"
          error={step1Submitted && !!step1Form.formState.errors.username}
          helperText={step1Submitted && step1Form.formState.errors.username ? step1Form.formState.errors.username.message : undefined}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Họ và tên
        </label>
        <Input
          {...step1Form.register('full_name')}
          placeholder="Nguyễn Văn A"
          error={step1Submitted && !!step1Form.formState.errors.full_name}
          helperText={step1Submitted && step1Form.formState.errors.full_name ? step1Form.formState.errors.full_name.message : undefined}
        />
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

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Số điện thoại
        </label>
        <Input
          {...step1Form.register('phone')}
          type="tel"
          placeholder="0123456789"
          error={step1Submitted && !!step1Form.formState.errors.phone}
          helperText={step1Submitted && step1Form.formState.errors.phone ? step1Form.formState.errors.phone.message : undefined}
        />
      </div>

      <Button variant="primary" size="lg" className="w-full" htmlType="submit">
        Tiếp tục
      </Button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Mật khẩu
        </label>
        <Input
          {...step2Form.register('password')}
          type="password"
          placeholder="••••••••"
          error={!!step2Form.formState.errors.password}
          helperText={step2Form.formState.errors.password?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Xác nhận mật khẩu
        </label>
        <Input
          {...step2Form.register('confirmPassword')}
          type="password"
          placeholder="••••••••"
          error={!!step2Form.formState.errors.confirmPassword}
          helperText={step2Form.formState.errors.confirmPassword?.message}
        />
      </div>

      <div className="space-y-4">
        <Button variant="primary" size="lg" className="w-full" htmlType="submit">
          Tiếp tục
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={goToPreviousStep}>
          Quay lại
        </Button>
      </div>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Ngày sinh
        </label>
        <Input
          {...step3Form.register('dob')}
          type="date"
          error={!!step3Form.formState.errors.dob}
          helperText={step3Form.formState.errors.dob?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Giới tính
        </label>
        <select
          {...step3Form.register('gender')}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Chọn giới tính</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
        {step3Form.formState.errors.gender && (
          <p className="text-sm text-destructive mt-1">{step3Form.formState.errors.gender.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Địa chỉ
        </label>
        <Input
          {...step3Form.register('address')}
          placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
          error={!!step3Form.formState.errors.address}
          helperText={step3Form.formState.errors.address?.message}
        />
      </div>

      <div className="flex items-start">
        <input
          {...step3Form.register('agreeToTerms')}
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
      {step3Form.formState.errors.agreeToTerms && (
        <p className="text-sm text-destructive">{step3Form.formState.errors.agreeToTerms.message}</p>
      )}

      <div className="space-y-4">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          loading={isLoading}
          htmlType="submit"
        >
          Đăng ký
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
