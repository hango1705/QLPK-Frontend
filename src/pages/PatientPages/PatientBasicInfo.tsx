import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card, Button, Input, Alert } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { useAuth } from '@/hooks';

// Validation schema
const basicInfoSchema = yup.object({
  full_name: yup.string().required('Họ và tên là bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  phone: yup.string().required('Số điện thoại là bắt buộc'),
  address: yup.string().required('Địa chỉ là bắt buộc'),
  dob: yup.string().required('Ngày sinh là bắt buộc'),
  gender: yup.string().required('Giới tính là bắt buộc'),
  emergency_contact: yup.string().required('Liên hệ khẩn cấp là bắt buộc'),
  emergency_phone: yup.string().required('Số điện thoại khẩn cấp là bắt buộc'),
  insurance_number: yup.string(),
  blood_type: yup.string(),
  allergies: yup.string(),
  medical_history: yup.string(),
});

type BasicInfoFormData = yup.InferType<typeof basicInfoSchema>;

const PatientBasicInfo = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BasicInfoFormData>({
    resolver: yupResolver(basicInfoSchema) as any,
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      dob: user?.dob || '',
      gender: user?.gender || '',
      emergency_contact: '',
      emergency_phone: '',
      insurance_number: '',
      blood_type: '',
      allergies: '',
      medical_history: '',
    },
  });

  const onSubmit = async (data: BasicInfoFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (error) {
      showNotification.error('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thông tin cơ bản</h1>
              <p className="text-gray-600 mt-1">
                Quản lý thông tin cá nhân và liên hệ khẩn cấp
              </p>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <Button onClick={handleEdit} variant="primary">
                  Chỉnh sửa
                </Button>
              ) : (
                <>
                  <Button onClick={handleCancel} variant="outline">
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleSubmit(onSubmit)} 
                    variant="primary"
                    loading={isLoading}
                  >
                    Lưu thay đổi
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên *
                </label>
                <Input
                  {...register('full_name')}
                  disabled={!isEditing}
                  error={!!errors.full_name}
                  helperText={errors.full_name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  {...register('email')}
                  type="email"
                  disabled={!isEditing}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại *
                </label>
                <Input
                  {...register('phone')}
                  type="tel"
                  disabled={!isEditing}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sinh *
                </label>
                <Input
                  {...register('dob')}
                  type="date"
                  disabled={!isEditing}
                  error={!!errors.dob}
                  helperText={errors.dob?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính *
                </label>
                <select
                  {...register('gender')}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  } ${!isEditing ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ *
                </label>
                <Input
                  {...register('address')}
                  disabled={!isEditing}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                />
              </div>
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Liên hệ khẩn cấp</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên người liên hệ khẩn cấp *
                </label>
                <Input
                  {...register('emergency_contact')}
                  disabled={!isEditing}
                  error={!!errors.emergency_contact}
                  helperText={errors.emergency_contact?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại khẩn cấp *
                </label>
                <Input
                  {...register('emergency_phone')}
                  type="tel"
                  disabled={!isEditing}
                  error={!!errors.emergency_phone}
                  helperText={errors.emergency_phone?.message}
                />
              </div>
            </div>
          </Card>

          {/* Medical Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông tin y tế</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số bảo hiểm y tế
                </label>
                <Input
                  {...register('insurance_number')}
                  disabled={!isEditing}
                  error={!!errors.insurance_number}
                  helperText={errors.insurance_number?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhóm máu
                </label>
                <select
                  {...register('blood_type')}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.blood_type ? 'border-red-500' : 'border-gray-300'
                  } ${!isEditing ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Chọn nhóm máu</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dị ứng
                </label>
                <textarea
                  {...register('allergies')}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.allergies ? 'border-red-500' : 'border-gray-300'
                  } ${!isEditing ? 'bg-gray-100' : ''}`}
                  placeholder="Mô tả các dị ứng (nếu có)..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiền sử bệnh
                </label>
                <textarea
                  {...register('medical_history')}
                  disabled={!isEditing}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.medical_history ? 'border-red-500' : 'border-gray-300'
                  } ${!isEditing ? 'bg-gray-100' : ''}`}
                  placeholder="Mô tả tiền sử bệnh (nếu có)..."
                />
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default PatientBasicInfo;
