import React, { useState } from 'react';
import { Card, Button, Input, Alert } from '@/components/ui';
import { showNotification } from '@/components/ui';

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  invoiceNumber: string;
  dueDate: string;
  treatmentPlan: string;
}

const PatientPayment = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app, this would come from API
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([
    {
      id: '1',
      date: '2024-01-15',
      amount: 500000,
      description: 'Điều trị viêm nướu - Lần 1',
      status: 'paid',
      paymentMethod: 'Chuyển khoản',
      invoiceNumber: 'INV-2024-001',
      dueDate: '2024-01-15',
      treatmentPlan: 'Điều trị viêm nướu'
    },
    {
      id: '2',
      date: '2024-01-20',
      amount: 800000,
      description: 'Trám răng sâu',
      status: 'paid',
      paymentMethod: 'Tiền mặt',
      invoiceNumber: 'INV-2024-002',
      dueDate: '2024-01-20',
      treatmentPlan: 'Trám răng sâu'
    },
    {
      id: '3',
      date: '2024-01-22',
      amount: 300000,
      description: 'Điều trị viêm nướu - Lần 2',
      status: 'pending',
      invoiceNumber: 'INV-2024-003',
      dueDate: '2024-01-29',
      treatmentPlan: 'Điều trị viêm nướu'
    },
    {
      id: '4',
      date: '2024-01-10',
      amount: 200000,
      description: 'Khám tổng quát',
      status: 'overdue',
      invoiceNumber: 'INV-2024-004',
      dueDate: '2024-01-15',
      treatmentPlan: 'Khám tổng quát'
    }
  ]);

  const handleAddPayment = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Thêm thanh toán thành công!');
      setIsAdding(false);
    } catch (error) {
      showNotification.error('Có lỗi xảy ra khi thêm thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = async (paymentId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Thanh toán thành công!');
      // Update payment status
      setPaymentRecords(prev => 
        prev.map(p => p.id === paymentId ? { ...p, status: 'paid' as const } : p)
      );
    } catch (error) {
      showNotification.error('Có lỗi xảy ra khi thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'pending':
        return 'Chờ thanh toán';
      case 'overdue':
        return 'Quá hạn';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const totalPaid = paymentRecords
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = paymentRecords
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverdue = paymentRecords
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
              <p className="text-gray-600 mt-1">
                Quản lý thanh toán và lịch sử giao dịch
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setIsAdding(true)} 
                variant="primary"
              >
                Thêm thanh toán
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Đã thanh toán</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Chờ thanh toán</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Quá hạn</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalOverdue)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng giao dịch</p>
                <p className="text-lg font-bold text-gray-900">{paymentRecords.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Records */}
        <div className="space-y-6">
          {paymentRecords.map((payment) => (
            <Card key={payment.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {payment.description}
                  </h3>
                  <p className="text-gray-600">
                    Hóa đơn: {payment.invoiceNumber} • Ngày: {payment.date}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Phác đồ điều trị</h4>
                  <p className="text-gray-700 text-sm">{payment.treatmentPlan}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Hạn thanh toán</h4>
                  <p className="text-gray-700 text-sm">{payment.dueDate}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Phương thức thanh toán</h4>
                  <p className="text-gray-700 text-sm">
                    {payment.paymentMethod || 'Chưa chọn'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <Button variant="outline" size="sm">
                      Xem hóa đơn
                    </Button>
                    <Button variant="outline" size="sm">
                      Tải xuống
                    </Button>
                  </div>
                  
                  {payment.status === 'pending' && (
                    <Button 
                      onClick={() => handlePayNow(payment.id)}
                      variant="primary" 
                      size="sm"
                      loading={isLoading}
                    >
                      Thanh toán ngay
                    </Button>
                  )}
                  
                  {payment.status === 'overdue' && (
                    <Button 
                      onClick={() => handlePayNow(payment.id)}
                      variant="primary" 
                      size="sm"
                      loading={isLoading}
                    >
                      Thanh toán quá hạn
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add New Payment Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thêm thanh toán mới
                  </h3>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số hóa đơn
                      </label>
                      <Input placeholder="INV-2024-XXX" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tiền
                      </label>
                      <Input type="number" placeholder="0" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mô tả dịch vụ..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phác đồ điều trị
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Chọn phác đồ</option>
                        <option value="1">Điều trị viêm nướu</option>
                        <option value="2">Trám răng sâu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hạn thanh toán
                      </label>
                      <Input type="date" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phương thức thanh toán
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Chọn phương thức</option>
                        <option value="cash">Tiền mặt</option>
                        <option value="transfer">Chuyển khoản</option>
                        <option value="card">Thẻ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="pending">Chờ thanh toán</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="overdue">Quá hạn</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      onClick={() => setIsAdding(false)} 
                      variant="outline"
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleAddPayment}
                      variant="primary"
                      loading={isLoading}
                    >
                      Lưu thanh toán
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPayment;
