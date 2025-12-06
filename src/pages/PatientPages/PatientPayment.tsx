import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { patientAPI } from '@/services/api/patient';
import { doctorAPI } from '@/services';

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

interface TreatmentPlanApi {
  id: string;
  title: string;
  totalCost?: number;
  doctorFullname?: string;
  createAt?: string;
}

interface TreatmentPhasesApi {
  id: string;
  description?: string;
  cost?: number;
  startDate?: string; // dd/MM/yyyy
}

const PatientPayment = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      setFetching(true); setError(null);
      try {
        const plans = await patientAPI.getMyTreatmentPlans();
        const records: PaymentRecord[] = [];
        for (const plan of plans) {
          try {
            const phases = await doctorAPI.getTreatmentPhases(plan.id);
            if (phases.length > 0) {
              phases.forEach((ph, idx) => {
                const amount = ph.cost || 0;
                if (amount <= 0) return;
                records.push({
                  id: ph.id,
                  date: ph.startDate || plan.createAt || '-',
                  amount,
                  description: `${plan.title} - Giai đoạn ${idx + 1}`,
                  status: 'pending', // backend chưa có trạng thái thanh toán
                  invoiceNumber: `AUTO-${plan.id.slice(0, 6)}-${idx + 1}`,
                  dueDate: ph.startDate || '-',
                  treatmentPlan: plan.title,
                });
              });
            } else if ((plan.totalCost || 0) > 0) {
              records.push({
                id: plan.id,
                date: plan.createAt || '-',
                amount: plan.totalCost || 0,
                description: plan.title,
                status: 'pending',
                invoiceNumber: `AUTO-${plan.id.slice(0, 6)}`,
                dueDate: plan.createAt || '-',
                treatmentPlan: plan.title,
              });
            }
          } catch {}
        }
        setPaymentRecords(records);
      } catch {
        setError('Không thể tải dữ liệu thanh toán (sử dụng tổng chi phí phác đồ)');
      } finally { setFetching(false); }
    };
    load();
  }, []);

  const handleAddPayment = async () => {
    setIsLoading(true);
    try {
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
      // Tìm payment record để lấy amount
      const payment = paymentRecords.find(p => p.id === paymentId);
      if (!payment) {
        showNotification.error('Không tìm thấy thông tin thanh toán');
        return;
      }

      // Gọi API VNPay để tạo payment URL
      const response = await patientAPI.createVnPayPayment({
        amount: String(payment.amount),
        // bankCode có thể để trống hoặc thêm UI để user chọn
      });

      if (response.code === 'ok' && response.paymentUrl) {
        // Redirect đến VNPay payment page
        window.location.href = response.paymentUrl;
      } else {
        showNotification.error(response.message || 'Không thể tạo liên kết thanh toán');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      showNotification.error(
        error.response?.data?.message || 
        error.message || 
        'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.'
      );
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
        <div className="pl-4 sm:pl-6 lg:pl-8 pr-0">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
              <p className="text-gray-600 mt-1">
                Quản lý thanh toán và lịch sử giao dịch (chưa tích hợp trạng thái từ backend)
              </p>
            </div>
            {/* Ẩn nút thêm thanh toán */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-0 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Đã thanh toán</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Chờ thanh toán</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPending)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Quá hạn</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalOverdue)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Tổng giao dịch</p>
            <p className="text-lg font-bold text-gray-900">{paymentRecords.length}</p>
          </Card>
        </div>

        {/* Payment Records */}
        <div className="space-y-6">
          {!fetching && paymentRecords.map((payment) => (
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
                  {(payment.status === 'pending' || payment.status === 'overdue') && (
                    <Button 
                      onClick={() => handlePayNow(payment.id)}
                      variant="primary" 
                      size="sm"
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? 'Đang xử lý...' : 'Thanh toán qua VNPay'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {fetching && <Card className="p-6">Đang tải giao dịch...</Card>}
        </div>
      </div>
    </div>
  );
};

export default PatientPayment;
