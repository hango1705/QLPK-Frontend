import React, { useMemo, useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Card, Button, Input, Alert, AlertTitle, AlertDescription, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { patientAPI, type CostResponse } from '@/services/api/patient';
import { doctorAPI } from '@/services';
import { usePermission } from '@/hooks';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { queryKeys } from '@/services/queryClient';

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
  costData?: CostResponse; // Full cost data for detail modal
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
  const { hasPermission } = usePermission();
  const canGetAllTreatmentPhases = hasPermission('GET_ALL_TREATMENT_PHASES');
  const canUpdatePaymentCost = hasPermission('UPDATE_PAYMENT_COST');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCostDetail, setSelectedCostDetail] = useState<CostResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch all costs (real cost records from database)
  const { data: costs = [], isLoading: loadingCosts } = useQuery({
    queryKey: ['patient', 'costs'],
    queryFn: patientAPI.getAllMyCost,
    enabled: canUpdatePaymentCost,
  });

  // Fetch treatment plans
  const { data: treatmentPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: queryKeys.patient.myTreatmentPlans,
    queryFn: patientAPI.getMyTreatmentPlans,
    enabled: canGetAllTreatmentPhases,
  });

  // Fetch phases for all plans in parallel
  const phaseQueries = useQueries({
    queries: treatmentPlans.map((plan) => ({
      queryKey: queryKeys.patient.treatmentPhases(plan.id),
      queryFn: () => doctorAPI.getTreatmentPhases(plan.id),
      enabled: canGetAllTreatmentPhases && !!plan.id,
      retry: false,
    })),
  });

  // Transform costs to payment records
  // Use real cost records from database instead of phases/plans
  const paymentRecords = useMemo<PaymentRecord[]>(() => {
    if (!canUpdatePaymentCost || !costs.length) {
      // Fallback: if no costs, use phases/plans (for display only, not for payment)
      if (!canGetAllTreatmentPhases || !treatmentPlans.length) return [];
      
      const records: PaymentRecord[] = [];
      treatmentPlans.forEach((plan, index) => {
        const phases = phaseQueries[index]?.data || [];
        if (phases.length > 0) {
          phases.forEach((ph, idx) => {
            const amount = ph.cost || 0;
            if (amount <= 0) return;
            records.push({
              id: ph.id, // This won't work for payment, but for display
              date: ph.startDate || plan.createAt || '-',
              amount,
              description: `${plan.title} - Giai đoạn ${idx + 1}`,
              status: 'pending',
              invoiceNumber: `AUTO-${plan.id.slice(0, 6)}-${idx + 1}`,
              dueDate: ph.startDate || '-',
              treatmentPlan: plan.title,
            });
          });
        } else if ((plan.totalCost || 0) > 0) {
          records.push({
            id: plan.id, // This won't work for payment, but for display
            date: plan.createAt || '-',
            amount: plan.totalCost || 0,
            description: plan.title,
            status: 'pending',
            invoiceNumber: `AUTO-${plan.id.slice(0, 6)}`,
            dueDate: plan.createAt || '-',
            treatmentPlan: plan.title,
          });
        }
      });
      return records;
    }

    // Use real cost records from database
    return costs.map((cost) => ({
      id: cost.id, // Real cost ID from database
      date: cost.paymentDate || '-',
      amount: cost.totalCost,
      description: cost.title,
      status: cost.status === 'paid' ? 'paid' : cost.status === 'wait' ? 'pending' : 'pending',
      paymentMethod: cost.paymentMethod,
      invoiceNumber: `AUTO-${cost.id.slice(0, 6)}`,
      dueDate: cost.paymentDate || '-',
      treatmentPlan: cost.title,
      costData: cost, // Store full cost data for detail modal
    }));
  }, [costs, treatmentPlans, phaseQueries, canGetAllTreatmentPhases, canUpdatePaymentCost]);

  const fetching = loadingCosts || loadingPlans || phaseQueries.some(q => q.isLoading);
  const error = phaseQueries.find(q => q.error)?.error 
    ? 'Không thể tải dữ liệu thanh toán (sử dụng tổng chi phí phác đồ)' 
    : null;

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

      // Lưu costId vào localStorage để sử dụng trong callback
      // paymentId có thể là phaseId hoặc planId, nhưng cần costId thực sự
      // Tạm thời sử dụng paymentId, sau này có thể cần map từ phaseId/planId sang costId
      localStorage.setItem('vnpay_costId', paymentId);

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
        localStorage.removeItem('vnpay_costId'); // Clean up on error
      }
    } catch (error: any) {
      localStorage.removeItem('vnpay_costId'); // Clean up on error
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

  const handleViewInvoice = (payment: PaymentRecord) => {
    // Find the full cost data
    const costData = costs.find(c => c.id === payment.id);
    if (costData) {
      setSelectedCostDetail(costData);
      setDetailModalOpen(true);
    }
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
        <div className="space-y-4">
          {!fetching && paymentRecords.map((payment) => (
            <Card key={payment.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {truncateText(payment.description, 60)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Hóa đơn: {payment.invoiceNumber} • Ngày: {payment.date}
                  </p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewInvoice(payment)}
                >
                  Xem hóa đơn
                </Button>
                {(payment.status === 'pending' || payment.status === 'overdue') && (
                  <PermissionGuard permission="UPDATE_PAYMENT_COST" fallback={
                    <Button 
                      variant="primary" 
                      size="sm"
                      disabled
                      className="bg-gray-400 text-white cursor-not-allowed"
                    >
                      Không có quyền thanh toán
                    </Button>
                  }>
                    <Button 
                      onClick={() => handlePayNow(payment.id)}
                      variant="primary" 
                      size="sm"
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? 'Đang xử lý...' : 'Thanh toán qua VNPay'}
                    </Button>
                  </PermissionGuard>
                )}
              </div>
            </Card>
          ))}
          {fetching && <Card className="p-6">Đang tải giao dịch...</Card>}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về thanh toán này
            </DialogDescription>
          </DialogHeader>
          
          {selectedCostDetail && (
            <div className="space-y-6 mt-4 overflow-x-hidden">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Mã hóa đơn</p>
                  <p className="text-base font-semibold text-gray-900">AUTO-{selectedCostDetail.id.slice(0, 6)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedCostDetail.status === 'paid' ? 'paid' : 'pending')}`}>
                    {getStatusText(selectedCostDetail.status === 'paid' ? 'paid' : 'pending')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Ngày thanh toán</p>
                  <p className="text-base text-gray-900">{selectedCostDetail.paymentDate || 'Chưa thanh toán'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phương thức thanh toán</p>
                  <p className="text-base text-gray-900">{selectedCostDetail.paymentMethod || 'Chưa chọn'}</p>
                </div>
                {selectedCostDetail.vnpTxnRef && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mã giao dịch VNPay</p>
                    <p className="text-base text-gray-900">{selectedCostDetail.vnpTxnRef}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Tổng tiền</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedCostDetail.totalCost)}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Mô tả</p>
                <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedCostDetail.title}</p>
              </div>

              {/* Dental Services */}
              {selectedCostDetail.listDentalServiceEntityOrder && selectedCostDetail.listDentalServiceEntityOrder.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-3">Dịch vụ nha khoa</p>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Tên dịch vụ</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 whitespace-nowrap">Đơn vị</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 whitespace-nowrap">Số lượng</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Đơn giá</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedCostDetail.listDentalServiceEntityOrder.map((service, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-sm text-gray-900 break-words">{service.name}</td>
                            <td className="px-3 py-2 text-sm text-center text-gray-600 whitespace-nowrap">{service.unit}</td>
                            <td className="px-3 py-2 text-sm text-center text-gray-600 whitespace-nowrap">{service.quantity}</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-600 whitespace-nowrap">{formatCurrency(service.unitPrice)}</td>
                            <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 whitespace-nowrap">{formatCurrency(service.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              {selectedCostDetail.listPrescriptionOrder && selectedCostDetail.listPrescriptionOrder.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-3">Đơn thuốc</p>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Tên thuốc</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Liều dùng</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Tần suất</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Thời gian</th>
                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 whitespace-nowrap">Số lượng</th>
                          <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Đơn giá</th>
                          <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedCostDetail.listPrescriptionOrder.map((prescription, idx) => (
                          <tr key={idx}>
                            <td className="px-2 py-2 text-sm text-gray-900 break-words max-w-[150px]">{prescription.name}</td>
                            <td className="px-2 py-2 text-sm text-gray-600 break-words max-w-[100px]">{prescription.dosage || '-'}</td>
                            <td className="px-2 py-2 text-sm text-gray-600 break-words max-w-[100px]">{prescription.frequency || '-'}</td>
                            <td className="px-2 py-2 text-sm text-gray-600 break-words max-w-[100px]">{prescription.duration || '-'}</td>
                            <td className="px-2 py-2 text-sm text-center text-gray-600 whitespace-nowrap">{prescription.quantity}</td>
                            <td className="px-2 py-2 text-sm text-right text-gray-600 whitespace-nowrap">{formatCurrency(prescription.unitPrice)}</td>
                            <td className="px-2 py-2 text-sm text-right font-medium text-gray-900 whitespace-nowrap">{formatCurrency(prescription.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedCostDetail.listPrescriptionOrder.some(p => p.notes) && (
                    <div className="mt-3 space-y-2">
                      {selectedCostDetail.listPrescriptionOrder.map((prescription, idx) => (
                        prescription.notes && (
                          <div key={idx} className="text-sm text-gray-600">
                            <span className="font-medium">{prescription.name}:</span> {prescription.notes}
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientPayment;
