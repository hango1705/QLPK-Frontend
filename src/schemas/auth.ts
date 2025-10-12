import * as yup from 'yup';

// Login form validation schema
export const loginSchema = yup.object({
  username: yup
    .string()
    .required('Tên đăng nhập là bắt buộc')
    .min(1, 'Tên đăng nhập không được để trống'),
  password: yup
    .string()
    .required('Mật khẩu là bắt buộc')
    .min(1, 'Mật khẩu không được để trống'),
  rememberMe: yup.boolean().default(false),
});

// Register form validation schema
export const registerSchema = yup.object().shape({
  username: yup
    .string()
    .required('Tên đăng nhập là bắt buộc')
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(20, 'Tên đăng nhập không được quá 20 ký tự'),
  password: yup
    .string()
    .required('Mật khẩu là bắt buộc')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(50, 'Mật khẩu không được quá 50 ký tự'),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu là bắt buộc')
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp'),
  full_name: yup
    .string()
    .required('Họ và tên là bắt buộc')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ'),
  phone: yup
    .string()
    .matches(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số'),
  address: yup.string(),
  dob: yup.string(),
  gender: yup.string().oneOf(['male', 'female', 'other'], 'Giới tính không hợp lệ'),
});

// Forgot password schema
export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ'),
});

// Reset password schema
export const resetPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required('Mật khẩu là bắt buộc')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu là bắt buộc')
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp'),
});

// Type definitions
export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
