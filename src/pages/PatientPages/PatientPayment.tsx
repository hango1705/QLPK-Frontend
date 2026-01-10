import React, { useMemo, useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Card, Button, Input, Alert, AlertTitle, AlertDescription, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { patientAPI, type CostResponse } from '@/services/api/patient';
import { doctorAPI } from '@/services';
import { usePermission } from '@/hooks';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { queryKeys } from '@/services/queryClient';
import { User, Wallet, CheckCircle2, Loader2, Stethoscope, Image as ImageIcon } from 'lucide-react';

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
  costData?: CostResponse;
  doctorName?: string;
  imageUrl?: string;
}

const PatientPayment = () => {
  const { hasPermission } = usePermission();
  const canGetAllTreatmentPhases = hasPermission('GET_ALL_TREATMENT_PHASES');
  const canUpdatePaymentCost = hasPermission('UPDATE_PAYMENT_COST');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCostDetail, setSelectedCostDetail] = useState<CostResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<'vnpay'>('vnpay');

  // Fetch patient info for profile section
  const { data: patientInfo } = useQuery({
    queryKey: ['patient', 'myInfo'],
    queryFn: patientAPI.getMyInfo,
  });

  // Fetch all costs (real cost records from database), excluding deposit costs
  const { data: costs = [], isLoading: loadingCosts } = useQuery({
    queryKey: ['patient', 'costs'],
    queryFn: async () => {
      const allCosts = await patientAPI.getAllMyCost();
      // Filter out deposit costs
      return allCosts.filter(cost => cost.type !== 'deposit');
    },
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

  // Helper function to extract description before "Ghi chú:"
  const extractDescriptionBeforeNote = (description: string): string => {
    if (!description) return '';
    const noteIndex = description.indexOf('Ghi chú:');
    if (noteIndex !== -1) {
      return description.substring(0, noteIndex).trim();
    }
    return description;
  };

  // Transform costs to payment records
  const paymentRecords = useMemo<PaymentRecord[]>(() => {
    if (!canUpdatePaymentCost || !costs.length) {
      if (!canGetAllTreatmentPhases || !treatmentPlans.length) return [];
      
      const records: PaymentRecord[] = [];
      treatmentPlans.forEach((plan, index) => {
        const phases = phaseQueries[index]?.data || [];
        if (phases.length > 0) {
          phases.forEach((ph, idx) => {
            const amount = ph.cost || 0;
            if (amount <= 0) return;
            records.push({
              id: ph.id,
              date: ph.startDate || plan.createAt || '-',
              amount,
              description: `${plan.title} - Giai đoạn ${idx + 1}`,
              status: 'pending',
              invoiceNumber: `DV-${String(idx + 1).padStart(3, '0')}`,
              dueDate: ph.startDate || '-',
              treatmentPlan: plan.title,
              doctorName: plan.doctorFullname,
            });
          });
        } else if ((plan.totalCost || 0) > 0) {
          records.push({
            id: plan.id,
            date: plan.createAt || '-',
            amount: plan.totalCost || 0,
            description: plan.title,
            status: 'pending',
            invoiceNumber: `DV-${plan.id.slice(0, 6)}`,
            dueDate: plan.createAt || '-',
            treatmentPlan: plan.title,
            doctorName: plan.doctorFullname,
          });
        }
      });
      return records;
    }

    // Transform costs to payment records
    const records: PaymentRecord[] = costs.map((cost) => {
      let status: 'pending' | 'paid' | 'overdue' | 'cancelled' = 'pending';
      if (cost.status === 'paid') {
        status = 'paid';
      } else if (cost.status === 'wait') {
        status = 'pending';
      }
      
      return {
        id: cost.id,
        date: cost.paymentDate || '-',
        amount: cost.totalCost,
        description: extractDescriptionBeforeNote(cost.title),
        status,
        paymentMethod: cost.paymentMethod,
        invoiceNumber: cost.id, // Use cost.id from database
        dueDate: cost.paymentDate || '-',
        treatmentPlan: cost.title,
        costData: cost,
        imageUrl: cost.listDentalServiceEntityOrder?.[0] ? undefined : undefined, // Placeholder for now
      };
    });

    return records;
  }, [costs, treatmentPlans, phaseQueries, canGetAllTreatmentPhases, canUpdatePaymentCost]);

  const pendingRecords = paymentRecords.filter(p => p.status === 'pending' || p.status === 'overdue');
  const historyRecords = paymentRecords.filter(p => p.status === 'paid');

  const fetching = loadingCosts || loadingPlans || phaseQueries.some(q => q.isLoading);

  const handlePayNow = async () => {
    if (selectedItems.size === 0) {
      showNotification.error('Vui lòng chọn ít nhất một dịch vụ để thanh toán');
      return;
    }

    setIsLoading(true);
    try {
      // Calculate total amount from selected items
      const totalAmount = Array.from(selectedItems).reduce((sum, id) => {
        const payment = paymentRecords.find(p => p.id === id);
        return sum + (payment?.amount || 0);
      }, 0);

      const finalAmount = totalAmount;

      // For now, use the first selected item's ID
      const firstSelectedId = Array.from(selectedItems)[0];
      localStorage.setItem('vnpay_costId', firstSelectedId);
      localStorage.setItem('vnpay_selectedItems', JSON.stringify(Array.from(selectedItems)));

      const response = await patientAPI.createVnPayPayment({
        amount: String(finalAmount),
      });

      if (response.code === 'ok' && response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        showNotification.error(response.message || 'Không thể tạo liên kết thanh toán');
        localStorage.removeItem('vnpay_costId');
        localStorage.removeItem('vnpay_selectedItems');
      }
    } catch (error: any) {
      localStorage.removeItem('vnpay_costId');
      localStorage.removeItem('vnpay_selectedItems');
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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
    const costData = costs.find(c => c.id === payment.id);
    if (costData) {
      setSelectedCostDetail(costData);
      setDetailModalOpen(true);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calculate summary
  const selectedPayments = paymentRecords.filter(p => selectedItems.has(p.id));
  const totalServices = selectedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalAmount = totalServices;

  // Get patient ID from patientInfo or generate placeholder
  const patientId = patientInfo?.id ? `BN-${patientInfo.id.slice(-4)}` : 'BN-XXXX';
  const patientName = patientInfo?.fullName || 'Bệnh nhân';
  const accountBalance = 0; // Placeholder

  return (
    <div className="min-h-screen">
      <div className="px-0 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Payment List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'history')}>
                <TabsList className="mb-6">
                  <TabsTrigger value="pending" className="relative">
                    Chi phí chờ thanh toán
                    {pendingRecords.length > 0 && (
                      <Badge className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {pendingRecords.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    Lịch sử điều trị
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {fetching ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : pendingRecords.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Không có chi phí chờ thanh toán
                    </div>
                  ) : (
                    pendingRecords.map((payment) => (
                      <Card key={payment.id} className="p-4 border hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          {/* Image */}
                          <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {payment.imageUrl ? (
                              <img src={payment.imageUrl} alt={payment.description} className="w-full h-full object-cover" />
                            ) : (
                              <Stethoscope className="h-8 w-8 text-gray-400" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={`text-xs ${getStatusColor(payment.status)}`}>
                                    {getStatusText(payment.status)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">Mã: {payment.invoiceNumber}</p>
                                <h3 className="text-base font-semibold text-gray-900 mb-1">
                                  {payment.description}
                                </h3>
                                {payment.doctorName && (
                                  <p className="text-sm text-gray-600">
                                    {payment.date} • BS. {payment.doctorName}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <button
                                onClick={() => handleViewInvoice(payment)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Xem chi tiết →
                              </button>
                              <input
                                type="checkbox"
                                checked={selectedItems.has(payment.id)}
                                onChange={() => toggleItemSelection(payment.id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  {fetching ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : historyRecords.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Chưa có lịch sử điều trị
                    </div>
                  ) : (
                    historyRecords.map((payment) => (
                      <Card key={payment.id} className="p-4 border">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <Badge className={`text-xs mb-2 ${getStatusColor(payment.status)}`}>
                                  {getStatusText(payment.status)}
                                </Badge>
                                <p className="text-xs text-gray-500 mb-1">Mã: {payment.invoiceNumber}</p>
                                <h3 className="text-base font-semibold text-gray-900 mb-1">
                                  {payment.description}
                                </h3>
                                {payment.doctorName && (
                                  <p className="text-sm text-gray-600">
                                    {payment.date} • BS. {payment.doctorName}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewInvoice(payment)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-3"
                            >
                              Xem chi tiết →
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Tóm tắt thanh toán</h3>

              {/* Summary Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng dịch vụ ({selectedItems.size})</span>
                  <span className="font-medium text-gray-900">{formatCurrency(totalServices)}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Tổng cộng</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">PHƯƠNG THỨC THANH TOÁN</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vnpay"
                      checked={paymentMethod === 'vnpay'}
                      onChange={() => setPaymentMethod('vnpay')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <span className="flex-1 font-medium">Ví VNPAY</span>
                  </label>
                </div>
              </div>

              {/* Pay Now Button */}
              <PermissionGuard permission="UPDATE_PAYMENT_COST" fallback={
                <Button
                  variant="primary"
                  className="w-full bg-gray-400 text-white cursor-not-allowed"
                  disabled
                >
                  Không có quyền thanh toán
                </Button>
              }>
                <Button
                  onClick={handlePayNow}
                  variant="primary"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading || selectedItems.size === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Thanh toán ngay'
                  )}
                </Button>
              </PermissionGuard>

              <p className="text-xs text-gray-500 text-center mt-4">
                Giao dịch được bảo mật và mã hóa an toàn.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
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
