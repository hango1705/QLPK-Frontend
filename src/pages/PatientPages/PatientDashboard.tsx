import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/hooks';

const PatientDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      title: 'Thông tin cơ bản',
      description: 'Xem và cập nhật thông tin cá nhân',
      path: '/patient/basic-info',
      icon: '👤',
      color: 'bg-blue-500'
    },
    {
      title: 'Hồ sơ khám ban đầu',
      description: 'Thông tin khám bệnh lần đầu',
      path: '/patient/initial-examination',
      icon: '📋',
      color: 'bg-green-500'
    },
    {
      title: 'Phác đồ điều trị',
      description: 'Kế hoạch điều trị được bác sĩ chỉ định',
      path: '/patient/treatment-plan',
      icon: '📝',
      color: 'bg-purple-500'
    },
    {
      title: 'Tiến trình điều trị',
      description: 'Theo dõi quá trình điều trị',
      path: '/patient/treatment-progress',
      icon: '📊',
      color: 'bg-orange-500',
      required: true
    },
    {
      title: 'Thanh toán',
      description: 'Lịch sử và quản lý thanh toán',
      path: '/patient/payment',
      icon: '💳',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Chào mừng, {user?.full_name || user?.username}!
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý thông tin và theo dõi quá trình điều trị của bạn
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Vai trò</p>
                <p className="font-medium text-gray-900">Bệnh nhân</p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">👤</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Lần khám</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📝</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Phác đồ</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tiến trình</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Thanh toán</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.path}>
              <Card className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                <div className="flex items-start">
                  <div className={`p-3 ${item.color} rounded-lg text-white text-2xl`}>
                    {item.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        {item.title}
                      </h3>
                      {item.required && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Quan trọng
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">
                      {item.description}
                    </p>
                    <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                      Truy cập
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Cập nhật tiến trình điều trị</p>
                  <p className="text-xs text-gray-500">2 giờ trước</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Thanh toán thành công</p>
                  <p className="text-xs text-gray-500">1 ngày trước</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Nhận phác đồ điều trị mới</p>
                  <p className="text-xs text-gray-500">3 ngày trước</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
