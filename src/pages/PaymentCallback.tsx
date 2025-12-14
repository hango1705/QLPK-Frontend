import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Loading, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { patientAPI } from '@/services/api/patient';
import type { CostPaymentUpdateRequest } from '@/services/api/patient';
import { queryKeys } from '@/services/queryClient';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'processing' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract VNPay callback parameters
  const vnpAmount = searchParams.get('vnp_Amount');
  const vnpBankCode = searchParams.get('vnp_BankCode');
  const vnpBankTranNo = searchParams.get('vnp_BankTranNo');
  const vnpCardType = searchParams.get('vnp_CardType');
  const vnpOrderInfo = searchParams.get('vnp_OrderInfo');
  const vnpPayDate = searchParams.get('vnp_PayDate');
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const vnpTransactionNo = searchParams.get('vnp_TransactionNo');
  const vnpTransactionStatus = searchParams.get('vnp_TransactionStatus');
  const vnpTxnRef = searchParams.get('vnp_TxnRef');
  const vnpSecureHash = searchParams.get('vnp_SecureHash');

  // Extract costId from orderInfo or localStorage
  // Format: "Thanh toan don hang:78275465" or we can store costId in localStorage before redirect
  const getCostId = (): string | null => {
    // Try to get from localStorage first (more reliable)
    const storedCostId = localStorage.getItem('vnpay_costId');
    if (storedCostId) {
      localStorage.removeItem('vnpay_costId'); // Clean up after use
      return storedCostId;
    }
    
    // Fallback: try to extract from orderInfo if it contains costId
    // This is a fallback, better to use localStorage
    return null;
  };

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async (data: {
      costId: string;
      paymentMethod: string;
      status: string;
      vnpTxnRef: string;
    }) => {
      const updateData: CostPaymentUpdateRequest = {
        paymentMethod: data.paymentMethod,
        status: data.status,
        vnpTxnRef: data.vnpTxnRef,
      };
      return patientAPI.updateCostPayment(data.costId, updateData);
    },
    onSuccess: () => {
      // Invalidate cost queries to refresh payment list
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.costs });
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.myTreatmentPlans });
      setPaymentStatus('success');
      setIsProcessing(false);
      showNotification.success('Cập nhật thanh toán thành công!');
    },
    onError: (error: any) => {
      setPaymentStatus('failed');
      setIsProcessing(false);
      const errorMsg = error.response?.data?.result || error.message || 'Không thể cập nhật thanh toán';
      setErrorMessage(errorMsg);
      showNotification.error(errorMsg);
    },
  });

  useEffect(() => {
    // Check if this is a valid VNPay callback
    if (!vnpResponseCode && !vnpTransactionStatus) {
      setPaymentStatus('failed');
      setIsProcessing(false);
      setErrorMessage('Thiếu thông tin từ VNPay. Vui lòng kiểm tra lại.');
      return;
    }

    // Check payment status
    // vnp_ResponseCode = '00' means success
    // vnp_TransactionStatus = '00' means success
    const isSuccess = vnpResponseCode === '00' && vnpTransactionStatus === '00';

    if (!isSuccess) {
      setPaymentStatus('failed');
      setIsProcessing(false);
      setErrorMessage('Thanh toán không thành công. Vui lòng thử lại.');
      return;
    }

    // Payment successful, update in backend
    const costId = getCostId();
    if (!costId) {
      setPaymentStatus('failed');
      setIsProcessing(false);
      setErrorMessage('Không tìm thấy thông tin hóa đơn. Vui lòng liên hệ hỗ trợ.');
      return;
    }

    // Determine payment method from bank code
    const paymentMethod = vnpBankCode ? `VNPay-${vnpBankCode}` : 'VNPay';

    // Update payment status
    // Status: 'paid' for successful payment
    updatePaymentMutation.mutate({
      costId,
      paymentMethod,
      status: 'paid',
      vnpTxnRef: vnpTxnRef || vnpTransactionNo || '',
    });
  }, []);

  const handleBackToPayment = () => {
    // Navigate to patient dashboard with payment section
    navigate('/patient?section=payment');
  };

  const handleBackToHome = () => {
    navigate('/patient?section=payment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center space-y-6">
          {isProcessing && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Đang xử lý thanh toán...</h1>
              <p className="text-muted-foreground">
                Vui lòng đợi trong giây lát. Chúng tôi đang cập nhật thông tin thanh toán của bạn.
              </p>
            </>
          )}

          {paymentStatus === 'success' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-green-600">Thanh toán thành công!</h1>
              <p className="text-muted-foreground">
                Giao dịch của bạn đã được xử lý thành công.
              </p>

              {/* Payment Details */}
              <div className="mt-6 space-y-3 text-left bg-muted/30 rounded-xl p-4">
                {vnpAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-semibold">
                      {parseInt(vnpAmount) / 100} ₫
                    </span>
                  </div>
                )}
                {vnpBankCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <span className="font-semibold">{vnpBankCode}</span>
                  </div>
                )}
                {vnpTransactionNo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã giao dịch:</span>
                    <span className="font-semibold">{vnpTransactionNo}</span>
                  </div>
                )}
                {vnpPayDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thời gian:</span>
                    <span className="font-semibold">
                      {vnpPayDate.slice(6, 8)}/{vnpPayDate.slice(4, 6)}/{vnpPayDate.slice(0, 4)} {vnpPayDate.slice(8, 10)}:{vnpPayDate.slice(10, 12)}:{vnpPayDate.slice(12, 14)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={handleBackToPayment} variant="outline">
                  Quay lại trang thanh toán
                </Button>
                <Button onClick={handleBackToHome}>
                  Về trang chủ
                </Button>
              </div>
            </>
          )}

          {paymentStatus === 'failed' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-4">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-red-600">Thanh toán thất bại</h1>
              
              {errorMessage && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Lỗi</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Transaction Details */}
              {vnpTransactionNo && (
                <div className="mt-6 space-y-3 text-left bg-muted/30 rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã giao dịch:</span>
                    <span className="font-semibold">{vnpTransactionNo}</span>
                  </div>
                  {vnpResponseCode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mã phản hồi:</span>
                      <span className="font-semibold">{vnpResponseCode}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={handleBackToPayment} variant="outline">
                  Quay lại trang thanh toán
                </Button>
                <Button onClick={handleBackToHome}>
                  Về trang chủ
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentCallback;

